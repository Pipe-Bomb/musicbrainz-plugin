import {
	ArtistIdentifier,
	ArtistInformationHelper,
	IdentifierDependency,
	Identity,
	Logger,
} from "@sdk";
import { requestMusicBrainz } from "../util/musicbrainz.util.js";
import { AxiosError } from "axios";
import {
	MusicBrainzMultipleResourceResponse,
	MusicBrainzResource,
} from "../type/musicbrainz.js";

interface Url {
	url: string;
	identity: Identity;
}

export class MusicBrainzArtistIdArtistIdentifier implements ArtistIdentifier {
	public readonly id = "musicbrainz_artist_id";

	getDependencies(): IdentifierDependency[] {
		return [];
	}

	getSoftDependencies(): IdentifierDependency[] {
		return [
			{
				pluginId: null,
				sourceId: "soundcloud_artist_permalink",
			},
			{
				pluginId: null,
				sourceId: "spotify_artist_id",
			},
		];
	}

	async identify(
		helper: ArtistInformationHelper,
		logger: Logger,
	): Promise<string[] | null> {
		const urls: Url[] = [];

		const getUrl = (
			identities: Identity[] | null,
			toUrl: (value: string) => string,
		) => {
			if (identities) {
				for (const identity of identities) {
					urls.push({
						identity,
						url: toUrl(identity.value),
					});
				}
			}
		};

		getUrl(
			helper.getIdentity("soundcloud_artist_permalink", null, true),
			(permalink) => `https://soundcloud.com/${permalink}`,
		);
		getUrl(
			helper.getIdentity("spotify_artist_id", null, true),
			(id) => `https://open.spotify.com/artist/${id}`,
		);
		// todo: add more

		if (!urls.length) {
			return null;
		}

		const params = new URLSearchParams();
		for (const { url } of urls) {
			params.append("resource", url);
		}

		try {
			const response = await requestMusicBrainz<
				MusicBrainzResource | MusicBrainzMultipleResourceResponse
			>(`/url?${params.toString()}`, logger, ["artist-rels"]);

			const resources: MusicBrainzResource[] = [];
			if ("url-count" in response) {
				resources.push(...response.urls);
			} else {
				resources.push(response);
			}

			const artistIds: string[] = [];

			for (const resource of resources) {
				if (!resource.relations?.length) {
					continue;
				}

				const relations = resource.relations.filter(
					(relation) => relation["target-type"] == "artist",
				);

				for (const relation of relations) {
					const artist = relation.artist;
					if (artist) {
						logger.log(
							`Got MusicBrainz artist from external URLS: ${artist.id}`,
						);
						artistIds.push(artist.id);
					}
				}
			}

			if (artistIds.length) {
				logger.log(
					`Total of ${artistIds.length} artist IDs for "${helper.getArtistUuid()}":`,
					artistIds,
				);
			}

			return Array.from(new Set(artistIds));
		} catch (e) {
			if (e instanceof AxiosError && e.response?.status == 404) {
				logger.log("No relations found");
				return null;
			}
			throw e;
		}
	}
}
