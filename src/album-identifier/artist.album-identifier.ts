import {
	AlbumIdentifier,
	AlbumIdentifierTarget,
	AlbumInformationHelper,
	IdentifierDependency,
	Logger,
} from "@sdk";
import { requestMusicBrainz } from "../util/musicbrainz.util.js";
import { MusicBrainzReleaseGroup } from "../type/musicbrainz.js";

export class MusicBrainzArtistAlbumIdentifier implements AlbumIdentifier {
	public target: AlbumIdentifierTarget = "artist";
	public id = "musicbrainz_artist_id";

	async identify(
		helper: AlbumInformationHelper,
		logger: Logger,
	): Promise<string[] | null> {
		const releaseGroupIdentifier = await helper.getIdentity(
			"musicbrainz_release_group_id",
		);
		if (!releaseGroupIdentifier) {
			return null;
		}

		const releaseGroup = await requestMusicBrainz<MusicBrainzReleaseGroup>(
			`/release-group/${releaseGroupIdentifier.value}`,
			logger,
			["artist-credits", "annotation", "tags", "genres"],
		);

		const artists: string[] = [];

		if (releaseGroup["artist-credit"]) {
			for (const credit of releaseGroup["artist-credit"]) {
				if (
					credit.artist?.id &&
					credit.artist.id != "89ad4ac3-39f7-470e-963a-56509c546377" // ignore "Various Artists"
				) {
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
