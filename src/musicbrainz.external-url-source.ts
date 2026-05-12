import {
	ArtistExternalUrlHelper,
	ExternalUrl,
	ExternalUrlSource,
	TrackExternalUrlHelper,
} from "@sdk";

export class MusicBrainzExternalUrlSource implements ExternalUrlSource {
	getArtistUrls(helper: ArtistExternalUrlHelper): ExternalUrl[] | null {
		const artistId = helper.getIdentity("musicbrainz_artist_id");
		if (artistId) {
			return [
				{
					iconId: "musicbrainz_logo",
					name: "MusicBrainz Artist",
					url: `https://musicbrainz.org/artist/${artistId.value}`,
				},
			];
		}
		return null;
	}

	getTrackUrls(helper: TrackExternalUrlHelper): ExternalUrl[] | null {
		return null;
	}
}
