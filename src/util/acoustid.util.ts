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
	chromaprint: string,
	clientId: string,
) {
	const cachedResponse = cache.get(chromaprint);
	if (cachedResponse) {
		return cachedResponse;
	}

	const parts = chromaprint.split(":", 2);
	if (parts.length != 2) {
		return null;
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
	params.set("duration", parts[0]!);
	params.set("fingerprint", parts[1]!);

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

		cache.set(chromaprint, data.results);
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
