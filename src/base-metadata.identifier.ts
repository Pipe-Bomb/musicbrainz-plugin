import {
	TrackIdentifier,
	IdentifierDependency,
	TrackIdentifierTarget,
	TrackInformationHelper,
	Logger,
} from "@sdk";
import { ICommonTagsResult } from "music-metadata";
import { getAcoustIdResults } from "./util/acoustid.util.js";
import { getTrackMetadata } from "./util/track.util.js";
import { AcoustIdResult } from "./type/acoustid.js";
import { MusicBrainzConfigManager } from "./musicbrainz.config-manager.js";

const MATCH_THRESHOLD = 0.9;

export abstract class BaseMetadataIdentifier implements TrackIdentifier {
	abstract readonly id: string;
	abstract readonly target: TrackIdentifierTarget;
	protected abstract tag: keyof ICommonTagsResult;
	protected abstract retrieveFromAcoustId(
		results: AcoustIdResult[],
	): string[] | null;

	constructor(private readonly config: MusicBrainzConfigManager) {}

	protected async checkMetadata(helper: TrackInformationHelper) {
		const metadata = await getTrackMetadata(helper);
		if (metadata) {
			if (this.tag in metadata.common) {
				const value = metadata.common[this.tag];
				if (typeof value == "string") {
					return [value];
				}
				if (Array.isArray(value) && !value.some((v) => typeof v != "string")) {
					return value as string[];
				}
			}
		}

		return null;
	}

	protected async checkChromaprint(helper: TrackInformationHelper) {
		const identity = await helper.getIdentity("chromaprint");
		if (identity) {
			const clientId = await this.config.getAcoustIdClientId();
			if (clientId) {
				const results = await getAcoustIdResults(identity.identity, clientId);
				if (results?.length) {
					const candidates = this.filterAcoustIDResults(results);
					if (candidates.length) {
						const identities = this.retrieveFromAcoustId(candidates);
						if (identities?.length) {
							return identities;
						}
					}
				}
			}
		}

		return null;
	}

	async identify(
		helper: TrackInformationHelper,
		_logger: Logger,
	): Promise<string[] | null> {
		const metadataIds = await this.checkMetadata(helper);
		if (metadataIds?.length) {
			return metadataIds;
		}

		return this.checkChromaprint(helper);
	}

	private filterAcoustIDResults(results: AcoustIdResult[]) {
		const candidates = results
			.filter((result) => result.score >= MATCH_THRESHOLD)
			.sort((a, b) => b.score - a.score);

		if (!candidates.length) {
			return [];
		}

		const topScore = candidates[0]!.score;
		const topTier = candidates.filter(
			(c) => Math.abs(c.score - topScore) < 0.001,
		);

		const withMetadata = topTier.filter(
			(c) => c.recordings && c.recordings.length > 0,
		);

		if (withMetadata.length) {
			return withMetadata;
		}
		return topTier;
	}

	getDependencies() {
		return [];
	}

	getSoftDependencies(): IdentifierDependency[] {
		return [
			{
				pluginId: null,
				sourceId: "chromaprint", // soft-depend chromaprint. pluginId is null so the dependency can be fulfilled by any plugin
			},
		];
	}
}
