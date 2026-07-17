import { ICommonTagsResult } from "music-metadata";
import { AcoustIdResult } from "../type/acoustid.js";
import {
	IdentifierDependency,
	Logger,
	TrackIdentifierTarget,
	TrackInformationHelper,
} from "@sdk";
import { getBestAcoustIdRecording } from "../util/acoustid.util.js";
import { BaseIsrcMetadataIdentifier } from "../base-isrc-metadata.identifier.js";
import {
	MusicBrainzArtistCredit,
	MusicBrainzISRC,
} from "../type/musicbrainz.js";
import { VARIOUS_ARTISTS_UUID } from "../constants.js";

export class ArtistTrackIdentifier extends BaseIsrcMetadataIdentifier {
	public id = "musicbrainz_artist_id";
	public readonly target: TrackIdentifierTarget = "artist";

	protected tags: (keyof ICommonTagsResult)[] = ["musicbrainz_artistid"];

	private getArtistIds(credits: MusicBrainzArtistCredit[]) {
		const ids = new Set<string>();
		let variousArtists = false;

		credits.forEach((credit) => {
			if (credit.artist?.id) {
				if (credit.artist.id == VARIOUS_ARTISTS_UUID) {
					variousArtists = true;
				} else {
					ids.add(credit.artist.id);
				}
			}
		});

		return { ids: Array.from(ids), variousArtists };
	}

	protected override async extractFromIsrc(
		response: MusicBrainzISRC,
	): Promise<string[] | null> {
		const credits = response.recordings.flatMap(
			(recording) => recording["artist-credit"] ?? [],
		);
		if (!credits.length) {
			return null;
		}

		const { ids, variousArtists } = this.getArtistIds(credits);
		if (ids.length) {
			return ids;
		}
		if (variousArtists) {
			return null;
		}
		return [];
	}

	protected override async checkAlternativeIdentities(
		helper: TrackInformationHelper,
		logger: Logger,
	): Promise<string[] | null> {
		const recordingIdentity = await helper.getIdentity(
			"musicbrainz_recording_id",
		);
		if (recordingIdentity) {
			try {
				const data = await this.cache.getRecording(recordingIdentity.identity);
				if (data["artist-credit"]?.length) {
					const { ids, variousArtists } = this.getArtistIds(
						data["artist-credit"],
					);
					if (ids.length) {
						return ids;
					}
					if (variousArtists) {
						return null;
					}
					return [];
				}
			} catch {
				logger.error("Failed to get recording to check for artists");
			}
		}

		const isrcResponse = await super.checkAlternativeIdentities(helper, logger);
		if (isrcResponse) {
			return isrcResponse;
		}

		const releaseGroupIdentity = await helper.getIdentity(
			"musicbrainz_release_group_id",
		);
		if (releaseGroupIdentity) {
			try {
				const data = await this.cache.getReleaseGroup(
					releaseGroupIdentity.identity,
				);
				if (data["artist-credit"]?.length) {
					const { ids, variousArtists } = this.getArtistIds(
						data["artist-credit"],
					);
					if (ids.length) {
						return ids;
					}
					if (variousArtists) {
						return null;
					}
					return [];
				}
			} catch {}
		}

		return null;
	}

	protected retrieveFromAcoustId(
		results: AcoustIdResult[],
		duration: number,
	): string[] | null {
		const recording = getBestAcoustIdRecording(results, duration);
		if (!recording?.artists) {
			return null;
		}

		const ids = new Set<string>();
		recording.artists.forEach((artist) => {
			if (artist.id) {
				ids.add(artist.id);
			}
		});

		return Array.from(ids);
	}

	getSoftDependencies(): IdentifierDependency[] {
		return [
			...super.getSoftDependencies(),
			{
				pluginId: null,
				sourceId: "musicbrainz_recording_id",
			},
			{
				pluginId: null,
				sourceId: "musicbrainz_release_group_id",
			},
		];
	}
}
