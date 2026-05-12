import { ICommonTagsResult } from "music-metadata";
import { BaseMetadataIdentifier } from "../base-metadata.identifier.js";
import { AcoustIdResult } from "../type/acoustid.js";
import { TrackIdentifierTarget } from "@sdk";

export class ReleaseTrackIdentifier extends BaseMetadataIdentifier {
	public id = "musicbrainz_release_id";
	public readonly target: TrackIdentifierTarget = "track";

	protected tag: keyof ICommonTagsResult = "musicbrainz_albumid";

	protected retrieveFromAcoustId(results: AcoustIdResult[]): string[] | null {
		const ids = new Set<string>();

		for (const result of results) {
			for (const recording of result.recordings ?? []) {
				for (const group of recording.releasegroups ?? []) {
					for (const release of group.releases ?? []) {
						if (release.id) ids.add(release.id);
					}
				}
			}
		}

		return Array.from(ids);
	}
}
