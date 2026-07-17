import { TrackInformationHelper, Logger, IdentifierDependency } from "@sdk";
import { BaseMetadataIdentifier } from "./base-metadata.identifier.js";
import { MusicBrainzISRC } from "./type/musicbrainz.js";

export abstract class BaseIsrcMetadataIdentifier extends BaseMetadataIdentifier {
	protected abstract extractFromIsrc(
		response: MusicBrainzISRC,
		logger: Logger,
	): Promise<string[] | null>;

	protected override async checkAlternativeIdentities(
		helper: TrackInformationHelper,
		logger: Logger,
	): Promise<string[] | null> {
		const isrcIdentity = await helper.getIdentity("isrc");
		if (!isrcIdentity?.identity) {
			return null;
		}

		try {
			const response = await this.cache.getIsrc(isrcIdentity.identity);

			if (response) {
				return this.extractFromIsrc(response, logger);
			}

			return null;
		} catch (e) {
			if (e instanceof Error) {
				logger.error(
					`Failed to get info for ISRC "${isrcIdentity.identity}": ${e.message}`,
				);
			} else {
				logger.error(`Failed to get info for ISRC "${isrcIdentity.identity}"`);
			}
			return null;
		}
	}

	override getSoftDependencies(): IdentifierDependency[] {
		return [
			...super.getSoftDependencies(),
			{
				sourceId: "isrc",
				pluginId: null,
			},
		];
	}
}
