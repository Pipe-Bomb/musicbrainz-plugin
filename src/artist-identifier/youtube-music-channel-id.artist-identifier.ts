import { BaseRelationIdentifier } from "../base-relation.identifier.js";
import { MusicBrainzRelation } from "../type/musicbrainz.js";

export class YoutubeMusicChannelIdArtistIdentifier extends BaseRelationIdentifier {
	public readonly id = "youtube_music_channel_id";

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

			if (slug.startsWith("channel/")) {
				return slug.substring("channel/".length).split("?")[0]!;
			}
		}

		return null;
	}
}
