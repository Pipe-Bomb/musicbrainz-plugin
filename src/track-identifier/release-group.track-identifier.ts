import { ICommonTagsResult } from "music-metadata";
import { BaseMetadataIdentifier } from "../base-metadata.identifier.js";
import { AcoustIdResult } from "../type/acoustid.js";
import { TrackIdentifierTarget } from "@sdk";

export class ReleaseGroupTrackIdentifier extends BaseMetadataIdentifier {
	public id = "musicbrainz_release_group_id";
	public readonly target: TrackIdentifierTarget = "album";

	protected tag: keyof ICommonTagsResult = "musicbrainz_releasegroupid";

	protected retrieveFromAcoustId(results: AcoustIdResult[]): string[] | null {
		const ids = new Set<string>();

		for (const result of results) {
			for (const recording of result.recordings ?? []) {
				for (const group of recording.releasegroups ?? []) {
					if (group.id) ids.add(group.id);
				}
			}
		}

		return Array.from(ids);
	}
}
