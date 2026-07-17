import { ICommonTagsResult } from "music-metadata";
import { AcoustIdResult } from "../type/acoustid.js";
import {
	IdentifierDependency,
	Logger,
	TrackIdentifierTarget,
	TrackInformationHelper,
} from "@sdk";
import { MusicBrainzISRC, MusicBrainzRelease } from "../type/musicbrainz.js";
import { BaseIsrcMetadataIdentifier } from "../base-isrc-metadata.identifier.js";
import { getBestAcoustIdRecording } from "../util/acoustid.util.js";

export class ReleaseGroupTrackIdentifier extends BaseIsrcMetadataIdentifier {
	public id = "musicbrainz_release_group_id";
	public readonly target: TrackIdentifierTarget = "album";

	protected tags: (keyof ICommonTagsResult)[] = ["musicbrainz_releasegroupid"];

	protected override async checkAlternativeIdentities(
		helper: TrackInformationHelper,
		logger: Logger,
	): Promise<string[] | null> {
		const recordingIdentity = await helper.getIdentity(
			"musicbrainz_recording_id",
		);
		if (recordingIdentity?.identity) {
			const recording = await this.cache.getRecording(
				recordingIdentity.identity,
			);
			if (recording.releases?.length) {
				const releases = recording.releases.filter(
					(release) => !!release["release-group"],
				);
				const bestRelease = this.selectBestReleaseGroup(releases);
				if (bestRelease?.["release-group"]?.id) {
					return [bestRelease["release-group"].id];
				}
			}
		}

		return super.checkAlternativeIdentities(helper, logger);
	}

	protected async extractFromIsrc(
		response: MusicBrainzISRC,
		logger: Logger,
	): Promise<string[] | null> {
		const primaryRecordingId = response.recordings?.[0]?.id;
		if (!primaryRecordingId) {
			return null;
		}

		const recording = await this.cache.getRecording(primaryRecordingId);

		if (recording.releases?.length) {
			const releases = recording.releases.filter(
				(release) => !!release["release-group"],
			);
			const bestRelease = this.selectBestReleaseGroup(releases);
			if (bestRelease?.["release-group"]?.id) {
				return [bestRelease["release-group"].id];
			}
		}

		return null;
	}

	protected retrieveFromAcoustId(
		results: AcoustIdResult[],
		duration: number,
	): string[] | null {
		const recording = getBestAcoustIdRecording(results, duration);
		if (!recording?.releasegroups?.length) return [];

		const scoredGroups = recording.releasegroups
			.map((group) => {
				if (!group.id) return null;
				let score = 0;

				if (group.type === "Album") score += 50;
				else if (group.type === "EP") score += 40;
				else if (group.type === "Single") score += 10;

				const secondaryTypes = group.secondarytypes || [];
				if (secondaryTypes.includes("Compilation")) {
					score -= 80;
				}
				if (secondaryTypes.includes("Soundtrack")) {
					score -= 20;
				}

				return { id: group.id, score };
			})
			.filter((g): g is { id: string; score: number } => g !== null);

		if (!scoredGroups.length) return [];

		const winner = scoredGroups.sort((a, b) => b.score - a.score)[0];
		if (winner) {
			return [winner.id];
		}
		return null;
	}

	private selectBestReleaseGroup(releases: MusicBrainzRelease[]) {
		if (!releases || releases.length === 0) return null;

		const scoredGroups = releases.map((release) => {
			const group = release["release-group"]!;
			let score = 0;

			if (release.status === "Official") {
				score += 100;
			}

			const type = group["primary-type"];
			if (type === "Album") {
				score += 50;
			} else if (type === "EP") {
				score += 40;
			} else if (type === "Single") {
				score += 10;
			}

			const secondaryTypes = group["secondary-types"] || [];
			if (secondaryTypes.includes("Compilation")) {
				score -= 80;
			}
			if (secondaryTypes.includes("Soundtrack")) {
				score -= 20;
			}

			return { id: group.id, score, date: release.date || "9999", release };
		});

		const winner = scoredGroups.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			return a.date.localeCompare(b.date);
		})[0];

		if (winner) {
			return winner.release;
		}

		return null;
	}

	getSoftDependencies(): IdentifierDependency[] {
		return [
			...super.getSoftDependencies(),
			{
				pluginId: null,
				sourceId: "musicbrainz_recording_id",
			},
		];
	}
}
