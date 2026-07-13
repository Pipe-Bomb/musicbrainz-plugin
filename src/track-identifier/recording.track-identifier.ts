import { ICommonTagsResult } from "music-metadata";
import { AcoustIdResult } from "../type/acoustid.js";
import { TrackIdentifierTarget } from "@sdk";
import { MusicBrainzISRC } from "../type/musicbrainz.js";
import { BaseIsrcMetadataIdentifier } from "../base-isrc-metadata.identifier.js";
import { getBestAcoustIdRecording } from "../util/acoustid.util.js";

export class RecordingTrackIdentifier extends BaseIsrcMetadataIdentifier {
	public id = "musicbrainz_recording_id";
	public readonly target: TrackIdentifierTarget = "track";

	protected tags: (keyof ICommonTagsResult)[] = [
		"musicbrainz_recordingid",
		"musicbrainz_trackid",
	];

	protected override async extractFromIsrc(
		response: MusicBrainzISRC,
	): Promise<string[] | null> {
		return response.recordings?.map((recording) => recording.id) ?? null;
	}

	protected retrieveFromAcoustId(
		results: AcoustIdResult[],
		duration: number,
	): string[] {
		const recording = getBestAcoustIdRecording(results, duration);
		if (recording?.id) {
			return [recording.id];
		}
		return [];
	}
}
