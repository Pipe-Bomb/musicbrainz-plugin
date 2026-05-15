import { ICommonTagsResult } from "music-metadata";
import { BaseMetadataIdentifier } from "../base-metadata.identifier.js";
import { AcoustIdResult } from "../type/acoustid.js";
import {
	IdentifierDependency,
	Logger,
	TrackIdentifierTarget,
	TrackInformationHelper,
} from "@sdk";
import { requestMusicBrainz } from "../util/musicbrainz.util.js";
import { MusicBrainzRecording } from "../type/musicbrainz.js";

export class ReleaseTrackIdentifier extends BaseMetadataIdentifier {
	public id = "musicbrainz_release_id";
	public readonly target: TrackIdentifierTarget = "track";

	protected tag: keyof ICommonTagsResult = "musicbrainz_albumid";

	// async identify(helper: TrackInformationHelper, logger: Logger): Promise<string[] | null> {
	// 	const metadataIds = await this.checkMetadata(helper);
	// 	if (metadataIds?.length) {
	// 		return metadataIds;
	// 	}

	// 	const recordingIdentity = await helper.getIdentity("musicbrainz_recording_id");
	// 	if (recordingIdentity) {
	// 		const recording = await requestMusicBrainz<MusicBrainzRecording>(`/recording/${recordingIdentity.value}`, logger, ["releases", "release-groups"]);
	// 		if (recording.releases?.length) {
	// 			recording.releases.map
	// 		}
	// 	}

	// 	return this.checkChromaprint(helper);
	// }

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

	getSoftDependencies(): IdentifierDependency[] {
		return [
			...super.getSoftDependencies(),
			{
				sourceId: "musicbrainz_recording_id",
				pluginId: null,
			},
		];
	}
}
