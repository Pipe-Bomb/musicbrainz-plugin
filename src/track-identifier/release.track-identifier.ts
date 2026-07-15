import { ICommonTagsResult } from "music-metadata";
import { AcoustIdResult } from "../type/acoustid.js";
import {
	IdentifierDependency,
	Logger,
	TrackIdentifierTarget,
	TrackInformationHelper,
} from "@sdk";
import { BaseIsrcMetadataIdentifier } from "../base-isrc-metadata.identifier.js";
import { MusicBrainzISRC, MusicBrainzRelease } from "../type/musicbrainz.js";
import { getBestAcoustIdRecording } from "../util/acoustid.util.js";

export class ReleaseTrackIdentifier extends BaseIsrcMetadataIdentifier {
	public id = "musicbrainz_release_id";
	public readonly target: TrackIdentifierTarget = "track";

	protected tags: (keyof ICommonTagsResult)[] = ["musicbrainz_albumid"];

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
				const bestRelease = this.selectBestRelease(recording.releases);
				if (bestRelease?.id) {
					return [bestRelease.id];
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
			const bestRelease = this.selectBestRelease(recording.releases);
			if (bestRelease?.id) {
				return [bestRelease.id];
			}
		}

		return null;
	}

	protected retrieveFromAcoustId(
		results: AcoustIdResult[],
		duration: number,
	): string[] | null {
		const recording = getBestAcoustIdRecording(results, duration);
		if (!recording?.releasegroups?.length) {
			return null;
		}

		const ids = new Set<string>();
		for (const group of recording.releasegroups) {
			for (const release of group.releases ?? []) {
				if (release.id) {
					ids.add(release.id);
				}
			}
		}

		return Array.from(ids);
	}

	private selectBestRelease(
		releases: MusicBrainzRelease[],
	): MusicBrainzRelease | null {
		if (!releases || releases.length === 0) return null;

		const scored = releases.map((release) => {
			let score = 0;

			if (release.status === "Official") {
				score += 100;
			} else if (release.status === "Promotion") {
				score += 50;
			}

			if (
				release.media?.some(
					(m) => m.format === "CD" || m.format === "Digital Media",
				)
			) {
				score += 20;
			}

			return { score, date: release.date || "9999", release };
		});

		const winner = scored.sort((a, b) => {
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
				sourceId: "musicbrainz_recording_id",
				pluginId: null,
			},
		];
	}
}
