import { TrackInformationHelper, Logger, IdentifierDependency } from "@sdk";
import { BaseMetadataIdentifier } from "./base-metadata.identifier.js";
import { Cache } from "./util/cache.js";
import { MusicBrainzISRC } from "./type/musicbrainz.js";
import { requestMusicBrainz } from "./util/musicbrainz.util.js";

const isrcCache = new Cache<string, MusicBrainzISRC>({
	maxEntries: 30,
	timeout: 30_000,
});

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

		const cacheKey = isrcIdentity.identity.trim();
		let response = isrcCache.get(cacheKey);

		if (!response) {
			response = await requestMusicBrainz<MusicBrainzISRC>(
				`/isrc/${cacheKey}`,
				logger,
				["artists", "releases"],
			);

			if (response) {
				isrcCache.set(cacheKey, response);
			}
		}

		if (response) {
			return this.extractFromIsrc(response, logger);
		}

		return null;
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
