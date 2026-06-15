import { BaseRelationIdentifier } from "../base-relation.identifier.js";
import { MusicBrainzRelation } from "../type/musicbrainz.js";

export class DiscogsArtistIdentifier extends BaseRelationIdentifier {
	public readonly id: string = "discogs_artist_id";

	protected findServiceId(relations: MusicBrainzRelation[]): string[] | null {
		return relations
			.filter(
				(relation) =>
					relation["target-type"] == "url" &&
					relation.url?.resource.startsWith("https://www.discogs.com/artist/"),
			)
			.map(
				(relation) =>
					relation
						.url!.resource.substring("https://www.discogs.com/artist/".length)
						.split("?")[0]!,
			);
	}
}
