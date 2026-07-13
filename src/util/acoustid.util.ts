import { USER_AGENT } from "../constants.js";
import { AcoustIdLookupResponse, AcoustIdResult } from "../type/acoustid.js";
import { Cache } from "./cache.js";
import Axios, { AxiosError } from "axios";

let lastRequestTime = Date.now();

const cache = new Cache<string, AcoustIdResult[]>({
	maxEntries: 30,
	timeout: 30_000,
});

const REQUEST_FIELDS = [
	"recordings",
	"releases",
	"releasegroups",
	"artists",
	"tracks",
	"compress",
];

export async function getAcoustIdResults(
	fingerprint: string,
	duration: number,
	clientId: string,
) {
	duration = Math.round(duration);
	const cacheKey = `${duration}:${fingerprint}`;
	const cachedResponse = cache.get(cacheKey);
	if (cachedResponse) {
		return cachedResponse;
	}

	const now = Date.now();
	const delay = lastRequestTime + 400 - now; // minimum 0.4s between requests to keep rate limit happy
	if (delay > 0) {
		await new Promise<void>((r) => setTimeout(r, delay));
	}
	lastRequestTime = now;

	const params = new URLSearchParams();
	params.set("client", clientId);
	params.set("meta", REQUEST_FIELDS.join(" "));
	params.set("duration", duration.toString());
	params.set("fingerprint", fingerprint);

	const requestUrl = `https://api.acoustid.org/v2/lookup?${params.toString()}`;

	try {
		const { data } = await Axios.get<AcoustIdLookupResponse>(requestUrl, {
			headers: {
				"User-Agent": USER_AGENT,
			},
			timeout: 10_000,
		});

		if (data.status !== "ok") {
			throw new Error(
				`AcoustID API error: ${data.error?.message ?? "Unknown error"}`,
			);
		}

		cache.set(cacheKey, data.results);
		return data.results;
	} catch (e: any) {
		if (e instanceof AxiosError && e.response) {
			throw new Error(
				`HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}`,
			);
		} else if ("request" in e && e.request) {
			throw new Error("No response from AcoustID API");
		} else {
			throw new Error(`Request error: ${e.message}`);
		}
	}
}

export function getBestAcoustIdRecording(
	results: AcoustIdResult[],
	duration: number,
) {
	let bestRecording = null;
	let minDelta = Infinity;

	for (const res of results) {
		for (const rec of res.recordings ?? []) {
			if (!rec.id) continue;

			if (rec.duration) {
				const delta = Math.abs(rec.duration - duration);
				if (delta < minDelta) {
					minDelta = delta;
					bestRecording = rec;
				}
			} else if (!bestRecording) {
				bestRecording = rec;
			}
		}
	}

	return bestRecording;
}
