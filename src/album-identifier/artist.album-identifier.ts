import {
	AlbumIdentifier,
	AlbumIdentifierTarget,
	AlbumInformationHelper,
	IdentifierDependency,
	Logger,
} from "@sdk";
import { VARIOUS_ARTISTS_UUID } from "../constants.js";
import { MusicBrainzCache } from "../musicbrainz.cache.js";

export class MusicBrainzArtistAlbumIdentifier implements AlbumIdentifier {
	public target: AlbumIdentifierTarget = "artist";
	public id = "musicbrainz_artist_id";

	constructor(private readonly cache: MusicBrainzCache) {}

	async identify(
		helper: AlbumInformationHelper,
		_logger: Logger,
	): Promise<string[] | null> {
		const releaseGroupIdentifier = await helper.getIdentity(
			"musicbrainz_release_group_id",
		);
		if (!releaseGroupIdentifier) {
			return null;
		}

		const releaseGroup = await this.cache.getReleaseGroup(
			releaseGroupIdentifier.identity,
		);

		const artists: string[] = [];

		if (releaseGroup["artist-credit"]) {
			for (const credit of releaseGroup["artist-credit"]) {
				if (credit.artist?.id && credit.artist.id != VARIOUS_ARTISTS_UUID) {
					artists.push(credit.artist.id);
				}
			}
		}

		return artists;
	}

	getDependencies(): IdentifierDependency[] {
		return [
			{
				sourceId: "musicbrainz_release_group_id",
				pluginId: null,
			},
		];
	}

	getSoftDependencies(): IdentifierDependency[] {
		return [];
	}
}
