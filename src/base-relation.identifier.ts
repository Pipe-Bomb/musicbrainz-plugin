import {
	IdentifierDependency,
	TrackIdentifierTarget,
	Logger,
	ArtistIdentifier,
	ArtistInformationHelper,
} from "@sdk";
import { MusicBrainzArtist, MusicBrainzRelation } from "./type/musicbrainz.js";
import { requestMusicBrainz } from "./util/musicbrainz.util.js";

export abstract class BaseRelationIdentifier implements ArtistIdentifier {
	abstract readonly id: string;

	protected abstract findServiceId(
		relations: MusicBrainzRelation[],
	): string | null;

	async identify(
		helper: ArtistInformationHelper,
		logger: Logger,
	): Promise<string[] | null> {
		const identity = helper.getIdentity("musicbrainz_artist_id");

		if (!identity) {
			return null;
		}

		const artist = await requestMusicBrainz<MusicBrainzArtist>(
			`/artist/${identity.identity}`,
			logger,
			["url-rels"],
		);

		// logger.debug(artist);

		if (artist.relations?.length) {
			const serviceId = this.findServiceId(artist.relations);
			if (serviceId) {
				return [serviceId];
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
