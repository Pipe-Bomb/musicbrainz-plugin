import type PipeBomb from "@sdk";
import { CoverArtArchiveAttributeSource } from "./attribute-source/cover-art-archive.attribute-source.js";
import { MusicBrainzAttributeSource } from "./attribute-source/musicbrainz.attribute-source.js";
import { ArtistTrackIdentifier } from "./track-identifier/artist.track-identifier.ts.js";
import { RecordingTrackIdentifier } from "./track-identifier/recording.track-identifier.js";
import { ReleaseGroupTrackIdentifier } from "./track-identifier/release-group.track-identifier.js";
import { SpotifyArtistIdentifier } from "./artist-identifier/spotify.artist-identifier.js";
import { DiscogsArtistIdentifier } from "./artist-identifier/discogs.artist-identifier.js";
import { SoundCloudArtistPermalinkIdentifier } from "./artist-identifier/soundcloud-artist-permalink.artist-identifier.js";
import { MusicBrainzExternalUrlSource } from "./musicbrainz.external-url-source.js";
import { MusicBrainzArtistIdArtistIdentifier } from "./artist-identifier/musicbrainz-artist-id.artist-identifier.js";
import { MusicBrainzArtistAlbumIdentifier } from "./album-identifier/artist.album-identifier.js";
import { MusicBrainzConfigManager } from "./musicbrainz.config-manager.js";
import { YoutubeHandleArtistIdentifier } from "./artist-identifier/youtube-handle.artist-identifier.js";
import { YoutubeChannelIdArtistIdentifier } from "./artist-identifier/youtube-channel-id.artist-identifier.js";
import { MusicBrainzCache } from "./musicbrainz.cache.js";
import path from "path";

export default class Plugin implements PipeBomb.Plugin {
	private api!: PipeBomb.PluginApiContext;
	private logger!: PipeBomb.Logger;

	enable(apiContext: PipeBomb.PluginApiContext) {
		this.api = apiContext;
		this.logger = apiContext.getLogger();

		this.api.registerLanguageDirectory("language");
		this.api.registerIconDirectory("icons");

		const config = new MusicBrainzConfigManager();
		this.api.registerConfigManager(config);

		this.api.registerExternalUrlSource(new MusicBrainzExternalUrlSource());

		this.api.requestCacheDirectory().then((cacheDir) => {
			const cache = new MusicBrainzCache(
				path.join(cacheDir, "musicbrainz-cache.db"),
				this.logger,
			);

			this.api.registerTrackIdentifier(
				new ArtistTrackIdentifier(config, cache),
			);
			this.api.registerTrackIdentifier(
				new RecordingTrackIdentifier(config, cache),
			);
			this.api.registerTrackIdentifier(
				new ReleaseGroupTrackIdentifier(config, cache),
			);

			this.api.registerArtistIdentifier(new SpotifyArtistIdentifier(cache));
			this.api.registerArtistIdentifier(new DiscogsArtistIdentifier(cache));
			this.api.registerArtistIdentifier(
				new SoundCloudArtistPermalinkIdentifier(cache),
			);
			this.api.registerArtistIdentifier(
				new MusicBrainzArtistIdArtistIdentifier(cache),
			);
			this.api.registerArtistIdentifier(
				new YoutubeHandleArtistIdentifier(cache),
			);
			this.api.registerArtistIdentifier(
				new YoutubeChannelIdArtistIdentifier(cache),
			);

			this.api.registerAlbumIdentifier(
				new MusicBrainzArtistAlbumIdentifier(cache),
			);

			this.api.registerAttributeSource(new MusicBrainzAttributeSource(cache));

			this.api.registerAttributeSource(new CoverArtArchiveAttributeSource());
		});
	}

	disable() {}

	public getLogger() {
		return this.logger;
	}

	public getApi() {
		return this.api;
	}
}
