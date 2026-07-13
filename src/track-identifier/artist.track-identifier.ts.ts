import { ICommonTagsResult } from "music-metadata";
import { AcoustIdResult } from "../type/acoustid.js";
import { TrackIdentifierTarget } from "@sdk";
import { getBestAcoustIdRecording } from "../util/acoustid.util.js";
import { BaseIsrcMetadataIdentifier } from "../base-isrc-metadata.identifier.js";
import { MusicBrainzISRC } from "../type/musicbrainz.js";

export class ArtistTrackIdentifier extends BaseIsrcMetadataIdentifier {
	public id = "musicbrainz_artist_id";
	public readonly target: TrackIdentifierTarget = "artist";

	protected tags: (keyof ICommonTagsResult)[] = ["musicbrainz_artistid"];

	protected override async extractFromIsrc(
		response: MusicBrainzISRC,
	): Promise<string[] | null> {
		const ids = new Set<string>();

		response.recordings.forEach((recording) => {
			recording["artist-credit"]?.forEach((credit) => {
				if (credit.artist?.id) {
					ids.add(credit.artist.id);
				}
			});
		});

		return Array.from(ids);
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
}
