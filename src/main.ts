import type PipeBomb from "@sdk";
import { CoverArtArchiveAttributeSource } from "./attribute-source/cover-art-archive.attribute-source.js";
import { MusicBrainzAttributeSource } from "./attribute-source/musicbrainz.attribute-source.js";
import { AcoustIDTrackIdentifier } from "./track-identifier/acoustid.track-identifier.js";
import { ArtistTrackIdentifier } from "./track-identifier/artist.track-identifier.ts.js";
import { RecordingTrackIdentifier } from "./track-identifier/recording.track-identifier.js";
import { ReleaseGroupTrackIdentifier } from "./track-identifier/release-group.track-identifier.js";
import { ReleaseTrackIdentifier } from "./track-identifier/release.track-identifier.js";
import { SpotifyArtistIdentifier } from "./artist-identifier/spotify.artist-identifier.js";
import { DiscogsArtistIdentifier } from "./artist-identifier/discogs.artist-identifier.js";
import { SoundCloudArtistPermalinkIdentifier } from "./artist-identifier/soundcloud-artist-permalink.artist-identifier.js";
import { MusicBrainzExternalUrlSource } from "./musicbrainz.external-url-source.js";
import { MusicBrainzArtistIdArtistIdentifier } from "./artist-identifier/musicbrainz-artist-id.artist-identifier.js";
import { MusicBrainzArtistAlbumIdentifier } from "./album-identifier/artist.album-identifier.js";
import { MusicBrainzConfigManager } from "./musicbrainz.config-manager.js";

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

		this.api.registerTrackIdentifier(new AcoustIDTrackIdentifier(config));
		this.api.registerTrackIdentifier(new ArtistTrackIdentifier(config));
		this.api.registerTrackIdentifier(new RecordingTrackIdentifier(config));
		this.api.registerTrackIdentifier(new ReleaseGroupTrackIdentifier(config));
		// this.api.registerTrackIdentifier(new ReleaseTrackIdentifier());

		this.api.registerArtistIdentifier(new SpotifyArtistIdentifier());
		this.api.registerArtistIdentifier(new DiscogsArtistIdentifier());
		this.api.registerArtistIdentifier(
			new SoundCloudArtistPermalinkIdentifier(),
		);
		this.api.registerArtistIdentifier(
			new MusicBrainzArtistIdArtistIdentifier(),
		);

		this.api.registerAlbumIdentifier(new MusicBrainzArtistAlbumIdentifier());

		this.api.registerAttributeSource(new MusicBrainzAttributeSource());
		this.api.registerAttributeSource(new CoverArtArchiveAttributeSource());

		this.api.registerExternalUrlSource(new MusicBrainzExternalUrlSource());
	}

	disable() {}

	public getLogger() {
		return this.logger;
	}

	public getApi() {
		return this.api;
	}
}
