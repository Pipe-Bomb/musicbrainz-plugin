import { Logger } from "@sdk";
import { PersistentCache } from "./persistent-cache.js";
import { requestMusicBrainz } from "./util/musicbrainz.util.js";
import {
	MusicBrainzArtist,
	MusicBrainzISRC,
	MusicBrainzRecordingResponse,
	MusicBrainzReleaseGroup,
} from "./type/musicbrainz.js";
import Axios, { AxiosError } from "axios";
import { AcoustIdLookupResponse } from "./type/acoustid.js";
import { USER_AGENT } from "./constants.js";

type CacheEntry<T> =
	| {
			success: true;
			data: T;
			include: string[];
	  }
	| {
			success: false;
			error: string;
	  };

export class MusicBrainzCache {
	private readonly cache: PersistentCache;

	constructor(
		dbFile: string,
		private readonly logger: Logger,
	) {
		this.cache = new PersistentCache(dbFile);
	}

	private async get<T>(
		key: string,
		include: string[],
		orFind: (include: string[]) => Promise<T>,
		ttl?: number,
	): Promise<T> {
		const response = (await this.cache.get(key)) as CacheEntry<T>;
		if (response) {
			if (response.success) {
				if (
					!include.some((inclusion) => !response.include.includes(inclusion))
				) {
					return response.data;
				}
			} else {
				throw new Error(
					`Cached error to prevent MusicBrainz API spam: ${response.error}`,
				);
			}
		}

		try {
			const response = await orFind(include);
			const cacheEntry: CacheEntry<T> = {
				success: true,
				data: response,
				include,
			};
			this.logger.debug("WRITING SUCCESS TO CACHE");
			await this.cache.set(key, cacheEntry, ttl);
			return response;
		} catch (e) {
			const cacheEntry: CacheEntry<any> = {
				success: false,
				error: e instanceof Error ? e.message : "Unknown error",
			};

			this.logger.debug("WRITING FAILURE TO CACHE");
			// cache errors for 3 hours
			await this.cache.set(key, cacheEntry, 3 * 3600 * 1000);
			throw e;
		}
	}

	getRecording(uuid: string) {
		return this.get(
			`recording:${uuid}`,
			["releases", "release-groups", "artist-credits", "genres", "ratings"],
			(include) =>
				requestMusicBrainz<MusicBrainzRecordingResponse>(
					`/recording/${uuid}`,
					this.logger,
					include,
				),
		);
	}

	getIsrc(isrc: string) {
		isrc = isrc.trim();
		return this.get(`isrc:${isrc}`, ["artists", "releases"], (include) =>
			requestMusicBrainz<MusicBrainzISRC>(
				`/isrc/${isrc}`,
				this.logger,
				include,
			),
		);
	}

	getArtist(uuid: string) {
		return this.get(
			`artist:${uuid}`,
			[
				"aliases",
				"annotation",
				"tags",
				"ratings",
				"genres",
				"url-rels",
				"area-rels",
				"artist-rels",
				"label-rels",
				"place-rels",
				"event-rels",
			],
			(include) =>
				requestMusicBrainz<MusicBrainzArtist>(
					`/artist/${uuid}`,
					this.logger,
					include,
				),
		);
	}

	getReleaseGroup(uuid: string) {
		return this.get(
			`release-group:${uuid}`,
			["artist-credits", "annotation", "tags", "genres"],
			(include) =>
				requestMusicBrainz<MusicBrainzReleaseGroup>(
					`/release-group/${uuid}`,
					this.logger,
					include,
				),
		);
	}

	private lastAcoustIdRequestTime = Date.now();
	getAcoustIdResults(fingerprint: string, duration: number, clientId: string) {
		duration = Math.round(duration);

		return this.get(
			`acoustid:${duration}:${fingerprint}`,
			[
				"recordings",
				"releases",
				"releasegroups",
				"artists",
				"tracks",
				"compress",
			],
			async (include) => {
				const now = Date.now();
				const delay = this.lastAcoustIdRequestTime + 400 - now; // minimum 0.4s between requests to keep rate limit happy
				if (delay > 0) {
					await new Promise<void>((r) => setTimeout(r, delay));
				}
				this.lastAcoustIdRequestTime = now;

				const params = new URLSearchParams();
				params.set("client", clientId);
				params.set("meta", include.join(" "));
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
			},
			86400 * 1_000,
		);
	}
}
