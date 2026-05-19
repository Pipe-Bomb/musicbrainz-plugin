import {
	AlbumExternalUrlHelper,
	ArtistExternalUrlHelper,
	ExternalUrl,
	ExternalUrlSource,
	TrackExternalUrlHelper,
} from "@sdk";

export class MusicBrainzExternalUrlSource implements ExternalUrlSource {
	getAlbumUrls(helper: AlbumExternalUrlHelper): ExternalUrl[] | null {
		const releaseGroupId = helper.getIdentity("musicbrainz_release_group_id");
		if (releaseGroupId) {
			return [
				{
					iconId: "musicbrainz_logo",
					name: "MusicBrainz Release Group",
					url: `https://musicbrainz.org/release-group/${releaseGroupId.value}`,
				},
			];
		}
		return null;
	}

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
		const recordingId = helper.getIdentity("musicbrainz_recording_id");
		if (recordingId) {
			return [
				{
					iconId: "musicbrainz_logo",
					name: "MusicBrainz Recording",
					url: `https://musicbrainz.org/recording/${recordingId.value}`,
				},
			];
		}

		return null;
	}
}
