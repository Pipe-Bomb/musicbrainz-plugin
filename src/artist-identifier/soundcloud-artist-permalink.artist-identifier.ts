import { BaseRelationIdentifier } from "../base-relation.identifier.js";
import { MusicBrainzRelation } from "../type/musicbrainz.js";

export class SoundCloudArtistPermalinkIdentifier extends BaseRelationIdentifier {
	public readonly id: string = "soundcloud_artist_permalink";

	protected findServiceId(relations: MusicBrainzRelation[]): string[] | null {
		return relations
			.filter(
				(relation) =>
					relation["target-type"] == "url" &&
					relation.url?.resource.startsWith("https://soundcloud.com/"),
			)
			.map(
				(relation) =>
					relation
						.url!.resource.substring("https://soundcloud.com/".length)
						.split("?")[0]!,
			);
	}
}
