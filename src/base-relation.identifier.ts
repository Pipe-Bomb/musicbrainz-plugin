import {
	IdentifierDependency,
	Logger,
	ArtistIdentifier,
	ArtistInformationHelper,
} from "@sdk";
import { MusicBrainzRelation } from "./type/musicbrainz.js";
import { MusicBrainzCache } from "./musicbrainz.cache.js";

export abstract class BaseRelationIdentifier implements ArtistIdentifier {
	abstract readonly id: string;

	constructor(private readonly cache: MusicBrainzCache) {}

	protected abstract findServiceId(
		relations: MusicBrainzRelation[],
	): string[] | null;

	async identify(
		helper: ArtistInformationHelper,
		_logger: Logger,
	): Promise<string[] | null> {
		const identity = helper.getIdentity("musicbrainz_artist_id");

		if (!identity) {
			return null;
		}

		const artist = await this.cache.getArtist(identity.identity);

		if (artist.relations?.length) {
			const serviceIds = this.findServiceId(artist.relations);
			if (serviceIds) {
				return serviceIds;
			}
		}

		return null;
	}

	getDependencies(): IdentifierDependency[] {
		return [
			{
				sourceId: "musicbrainz_artist_id",
				pluginId: null,
			},
		];
	}

	getSoftDependencies(): IdentifierDependency[] {
		return [];
	}
}
