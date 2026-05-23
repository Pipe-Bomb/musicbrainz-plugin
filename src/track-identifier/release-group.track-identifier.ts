import { ICommonTagsResult } from "music-metadata";
import { BaseMetadataIdentifier } from "../base-metadata.identifier.js";
import { AcoustIdResult } from "../type/acoustid.js";
import { Logger, TrackIdentifierTarget, TrackInformationHelper } from "@sdk";
import { requestMusicBrainz } from "../util/musicbrainz.util.js";
import {
	MusicBrainzRecording,
	MusicBrainzRelease,
} from "../type/musicbrainz.js";

export class ReleaseGroupTrackIdentifier extends BaseMetadataIdentifier {
	public id = "musicbrainz_release_group_id";
	public readonly target: TrackIdentifierTarget = "album";

	protected tag: keyof ICommonTagsResult = "musicbrainz_releasegroupid";

	async identify(
		helper: TrackInformationHelper,
		logger: Logger,
	): Promise<string[] | null> {
		const metadataIds = await this.checkMetadata(helper);
		if (metadataIds?.length) {
			return metadataIds;
		}

		const recordingIdentity = await helper.getIdentity(
			"musicbrainz_recording_id",
		);
		if (recordingIdentity) {
			const recording = await requestMusicBrainz<MusicBrainzRecording>(
				`/recording/${recordingIdentity.identity}`,
				logger,
				["releases", "release-groups"],
			);
			if (recording.releases?.length) {
				const releases = recording.releases.filter(
					(release) => !!release["release-group"],
				);
				const bestRelease = this.selectBestReleaseGroup(releases);
				if (bestRelease) {
					return [bestRelease["release-group"]!.id];
				}
			}
		}

		return this.checkChromaprint(helper);
	}

	protected retrieveFromAcoustId(results: AcoustIdResult[]): string[] | null {
		const ids = new Set<string>();

		for (const result of results) {
			for (const recording of result.recordings ?? []) {
				for (const group of recording.releasegroups ?? []) {
					if (group.id) ids.add(group.id);
				}
			}
		}

		// todo: pick the best one

		return Array.from(ids);
	}

	private selectBestReleaseGroup(releases: MusicBrainzRelease[]) {
		if (!releases || releases.length === 0) return null;

		const scoredGroups = releases.map((release) => {
			const group = release["release-group"]!;
			let score = 0;

			// 1. Status Check
			if (release.status === "Official") {
				score += 100;
			}

			// 2. Type Check
			const type = group["primary-type"];
			if (type === "Album") {
				score += 50;
			} else if (type === "EP") {
				score += 40;
			} else if (type === "Single") {
				score += 10;
			}

			// 3. Compilation Penalty (The "Various Artists" Safeguard)
			const secondaryTypes = group["secondary-types"] || [];
			if (secondaryTypes.includes("Compilation")) {
				score -= 80;
			}
			if (secondaryTypes.includes("Soundtrack")) {
				score -= 20;
			}

			return { id: group.id, score, date: release.date || "9999", release };
		});

		// Sort by Score (Descending), then by Date (Ascending/Oldest)
		const winner = scoredGroups.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			return a.date.localeCompare(b.date);
		})[0];

		if (winner) {
			return winner.release;
		}

		return null;
	}
}
