import { ICommonTagsResult } from "music-metadata";
import { BaseMetadataIdentifier } from "../base-metadata.identifier.js";
import { AcoustIdResult } from "../type/acoustid.js";
import {
	IdentifierDependency,
	Logger,
	TrackIdentifierTarget,
	TrackInformationHelper,
} from "@sdk";
import {
	MusicBrainzISRC,
	MusicBrainzRecordingQueryResponse,
} from "../type/musicbrainz.js";
import { requestMusicBrainz } from "../util/musicbrainz.util.js";

export class RecordingTrackIdentifier extends BaseMetadataIdentifier {
	public id = "musicbrainz_recording_id";
	public readonly target: TrackIdentifierTarget = "track";

	protected tag: keyof ICommonTagsResult = "musicbrainz_recordingid";

	async identify(
		helper: TrackInformationHelper,
		logger: Logger,
	): Promise<string[] | null> {
		const metadataIds = await this.checkMetadata(helper);

		if (metadataIds?.length) {
			return metadataIds;
		}

		const isrcIdentity = await helper.getIdentity("isrc");
		if (isrcIdentity) {
			const response = await requestMusicBrainz<MusicBrainzISRC>(
				`/isrc/${isrcIdentity.identity}`,
				logger,
				["releases"],
			);
			if (response.recordings?.length) {
				return response.recordings.map((recording) => recording.id);
			}
		}

		return this.checkChromaprint(helper);
	}

	protected retrieveFromAcoustId(results: AcoustIdResult[]): string[] {
		const ids = new Set<string>();
		results.forEach((res) =>
			res.recordings?.forEach((rec) => rec.id && ids.add(rec.id)),
		);
		return Array.from(ids);
	}

	getSoftDependencies(): IdentifierDependency[] {
		return [
			...super.getSoftDependencies(),
			{
				sourceId: "isrc",
				pluginId: null,
			},
		];
	}
}
