import { ICommonTagsResult } from "music-metadata";
import { BaseMetadataIdentifier } from "../base-metadata.identifier.js";
import { AcoustIdResult } from "../type/acoustid.js";
import { TrackIdentifierTarget } from "@sdk";

export class RecordingTrackIdentifier extends BaseMetadataIdentifier {
	public id = "musicbrainz_recording_id";
	public readonly target: TrackIdentifierTarget = "track";

	protected tag: keyof ICommonTagsResult = "musicbrainz_recordingid";

	protected retrieveFromAcoustId(results: AcoustIdResult[]): string[] {
		const ids = new Set<string>();
		results.forEach((res) =>
			res.recordings?.forEach((rec) => rec.id && ids.add(rec.id)),
		);
		return Array.from(ids);
	}
}
