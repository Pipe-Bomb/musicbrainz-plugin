import { BaseRelationIdentifier } from "../base-relation.identifier.js";
import { MusicBrainzRelation } from "../type/musicbrainz.js";

export class SpotifyArtistIdentifier extends BaseRelationIdentifier {
	public readonly id: string = "spotify_artist_id";

	protected findServiceId(relations: MusicBrainzRelation[]): string | null {
		const relation = relations.find(
			(relation) =>
				relation["target-type"] == "url" &&
				relation.url?.resource.startsWith("https://open.spotify.com/artist/"),
		);
		if (relation) {
			return relation
				.url!.resource.substring("https://open.spotify.com/artist/".length)
				.split("?")[0]!;
		}

		return null;
	}
}
