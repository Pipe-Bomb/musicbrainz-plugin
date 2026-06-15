import { BaseRelationIdentifier } from "../base-relation.identifier.js";
import { MusicBrainzRelation } from "../type/musicbrainz.js";

export class YoutubeChannelIdArtistIdentifier extends BaseRelationIdentifier {
	public readonly id = "youtube_channel_id";

	protected findServiceId(relations: MusicBrainzRelation[]): string[] | null {
		const urls = relations
			.filter((relation) => relation["target-type"] == "url" && relation.url)
			.map((relation) => relation.url!.resource);

		const identities: string[] = [];

		for (const url of urls) {
			if (url.startsWith("https://music.youtube.com/channel/")) {
				identities.push(
					url
						.substring("https://music.youtube.com/channel/".length)
						.split("?")[0]!,
				);
			}
			if (url.startsWith("https://www.youtube.com/channel/")) {
				identities.push(
					url
						.substring("https://www.youtube.com/channel/".length)
						.split("?")[0]!,
				);
			}
		}

		return identities;
	}
}
