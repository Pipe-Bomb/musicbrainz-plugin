import { ICommonTagsResult } from "music-metadata";
import { BaseMetadataIdentifier } from "../base-metadata.identifier.js";
import { AcoustIdResult } from "../type/acoustid.js";
import { TrackIdentifierTarget } from "@sdk";

export class ArtistTrackIdentifier extends BaseMetadataIdentifier {
	public id = "musicbrainz_artist_id";
	public readonly target: TrackIdentifierTarget = "artist";

	protected tag: keyof ICommonTagsResult = "musicbrainz_artistid";

	protected retrieveFromAcoustId(results: AcoustIdResult[]): string[] {
		const ids = new Set<string>();
		results.forEach((res) =>
			res.recordings?.forEach((rec) =>
				rec.artists?.forEach((art) => art.id && ids.add(art.id)),
			),
		);
		return Array.from(ids);
	}
}
