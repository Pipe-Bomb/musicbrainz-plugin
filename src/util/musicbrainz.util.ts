import Axios, { AxiosError, RawAxiosRequestHeaders } from "axios";
import { Queue } from "./queue.js";
import { USER_AGENT } from "../constants.js";
import { Logger } from "@sdk";

const MB_BASE_URL = "https://musicbrainz.org/ws/2";
const HEADERS: RawAxiosRequestHeaders = {
	Accept: "application/json",
	"User-Agent": USER_AGENT,
};

const queue = new Queue(1_100);

export async function requestMusicBrainz<T>(
	url: string,
	logger: Logger,
	include?: string[],
): Promise<T> {
	const params = new URLSearchParams();
	params.append("fmt", "json");
	if (include) {
		params.append("inc", include.join(" "));
	}
	const fullUrl = `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;

	return await queue.add(() => internalRequest<T>(fullUrl, logger));
}

async function internalRequest<T>(url: string, logger: Logger) {
	const request = async () => {
		const { data } = await Axios.get<T>(url, {
			baseURL: MB_BASE_URL,
			headers: HEADERS,
			timeout: 10_000,
			family: 4,
		});
		return data;
	};

	try {
		return await request();
	} catch (e) {
		if (e instanceof AxiosError && e.response?.status == 503) {
			logger.debug("Rate limited by MusicBrainz");
		} else {
			throw e;
		}
	}

	await new Promise<void>((r) => setTimeout(r, 2_000));
	return await request();
}
