import { BaseRelationIdentifier } from "../base-relation.identifier.js";
import { MusicBrainzRelation } from "../type/musicbrainz.js";

export class YoutubeMusicHandleArtistIdentifier extends BaseRelationIdentifier {
	public readonly id = "youtube_music_handle";

	protected findServiceId(relations: MusicBrainzRelation[]): string | null {
		const relation = relations.find(
			(relation) =>
				relation["target-type"] == "url" &&
				relation.url?.resource.startsWith("https://music.youtube.com/"),
		);

		if (relation) {
			const slug = relation.url!.resource.substring(
				"https://music.youtube.com/".length,
			);

			if (slug.startsWith("@")) {
				return slug.substring(1).split("?")[0]!;
			}
		}

		return null;
	}
}
