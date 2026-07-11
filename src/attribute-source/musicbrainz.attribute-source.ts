import {
	AlbumInformationHelper,
	AlbumMetadata,
	ArtistInformationHelper,
	ArtistMetadata,
	AttributeSource,
	AttributeSourceApiContext,
	AttributeValue,
	IdentifiableTrackArtistMetadata,
	Logger,
	TrackInformationHelper,
	TrackMetadata,
} from "@sdk";
import { AxiosError } from "axios";
import {
	MusicBrainzArtist,
	MusicBrainzRecordingResponse,
	MusicBrainzReleaseGroup,
} from "../type/musicbrainz.js";
import { requestMusicBrainz } from "../util/musicbrainz.util.js";
import { VARIOUS_ARTISTS_UUID } from "../constants.js";

export class MusicBrainzAttributeSource implements AttributeSource {
	private api!: AttributeSourceApiContext;
	private logger!: Logger;

	public readonly id = "musicbrainz";

	getName() {
		return "MusicBrainz";
	}

	enable(attributeSourceApiContext: AttributeSourceApiContext): void {
		this.api = attributeSourceApiContext;
		this.logger = this.api.getLogger();

		this.api.registerTrackAttributes([
			{
				key: "title",
				type: "string",
				supportsMultiple: false,
			},
			{
				key: "duration",
				type: "decimal",
				supportsMultiple: false,
				formatter: (value) => {
					let seconds = Math.floor(value);
					let minutes = Math.floor(seconds / 60);
					seconds -= minutes * 60;
					let hours = Math.floor(minutes / 60);
					minutes -= hours * 60;
					if (hours) {
						return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
					}
					return `${minutes}:${seconds.toString().padStart(2, "0")}`;
				},
			},
			{
				key: "rating",
				type: "decimal",
				supportsMultiple: false,
				formatter: (value) => {
					const stars = Math.max(Math.min(Math.round(value), 5), 0);
					let output = "";
					for (let i = 0; i < stars; i++) {
						output += "★";
					}
					for (let i = stars; i < 5; i++) {
						output += "☆";
					}
					return output;
				},
			},
			{
				key: "genre",
				type: "string",
				supportsMultiple: true,
			},
			{
				key: "artist",
				type: "string",
				supportsMultiple: true,
			},
		]);

		this.api.registerArtistAttributes([
			{
				key: "name",
				type: "string",
				supportsMultiple: false,
			},
			{
				key: "genre",
				type: "string",
				supportsMultiple: true,
			},
			{
				key: "area",
				type: "string",
				supportsMultiple: false,
			},
			{
				key: "area_code",
				type: "string",
				supportsMultiple: true,
			},
			{
				key: "disambiguation",
				type: "string",
				supportsMultiple: false,
			},
		]);

		this.api.registerAlbumAttributes([
			{
				key: "title",
				type: "string",
				supportsMultiple: false,
			},
			{
				key: "year",
				type: "integer",
				supportsMultiple: false,
			},
			{
				key: "artist",
				type: "string",
				supportsMultiple: true,
			},
		]);
	}

	async getTrackAttributeValues(
		helper: TrackInformationHelper,
	): Promise<TrackMetadata> {
		const recordingIdentity = await helper.getIdentity(
			"musicbrainz_recording_id",
		);
		if (!recordingIdentity) {
			return {
				attributes: null,
				artists: null,
			};
		}

		try {
			const data = await requestMusicBrainz<MusicBrainzRecordingResponse>(
				`/recording/${recordingIdentity.identity}`,
				this.logger,
				["artist-credits", "genres", "ratings"],
			);

			const trackAttributes: AttributeValue[] = [];
			if (data.title) {
				trackAttributes.push({
					key: "title",
					value: data.title,
				});
			}
			if (data.length) {
				trackAttributes.push({
					key: "duration",
					value: data.length / 1000,
				});
			}
			if (data.rating?.value) {
				trackAttributes.push({
					key: "rating",
					value: data.rating.value,
				});
			}
			if (data.genres) {
				trackAttributes.push(
					...data.genres.map((genre) => ({
						key: "genre",
						value: genre.name,
					})),
				);
			}

			let isVariousArtists = false;
			const artists: IdentifiableTrackArtistMetadata[] = [];
			if (data["artist-credit"]) {
				for (const credit of data["artist-credit"]) {
					const artist = credit.artist;

					if (artist?.id) {
						if (artist.id == VARIOUS_ARTISTS_UUID) {
							if (!isVariousArtists) {
								isVariousArtists = true;
								trackAttributes.push({
									key: "artist",
									value: "Various Artists",
								});
							}
						} else {
							artists.push({
								identityId: "musicbrainz_artist_id",
								identity: artist.id,
								joinPhrase: credit.joinphrase ?? null,
								attributes: [{ key: "name", value: artist.name }],
								pluginId: recordingIdentity.pluginId,
							});
						}
					}
				}
			}

			return {
				attributes: trackAttributes,
				artists,
			};
		} catch (e) {
			if (e instanceof AxiosError) {
				this.logger.error(
					`Failed to retrieve recording information from MusicBrainz for Recording "${recordingIdentity.identity}":`,
					{
						name: e.name,
						message: e.message,
						stack: e.stack,
						code: e.code,
					},
				);
				throw new Error("Request to MusicBrainz failed");
			}
			throw e;
		}
	}

	async getArtistAttributeValues(
		helper: ArtistInformationHelper,
	): Promise<ArtistMetadata> {
		const artistIdentity = await helper.getIdentity("musicbrainz_artist_id");

		const attributes: AttributeValue[] = [];

		if (artistIdentity) {
			const data = await requestMusicBrainz<MusicBrainzArtist>(
				`/artist/${artistIdentity.identity}`,
				this.logger,
				[
					"aliases",
					"annotation",
					"tags",
					"ratings",
					"genres",
					"url-rels",
					"area-rels",
					"artist-rels",
					"label-rels",
					"place-rels",
					"event-rels",
				],
			);

			attributes.push({
				key: "name",
				value: data.name,
			});

			data.genres?.forEach((genre) =>
				attributes.push({
					key: "genre",
					value: genre.name,
				}),
			);

			if (data.area) {
				attributes.push({
					key: "area",
					value: data.area.name,
				});

				if (data.area["iso-3166-1-codes"]) {
					attributes.push(
						...data.area["iso-3166-1-codes"].map((code) => ({
							key: "area_code",
							value: code,
						})),
					);
				}
			}

			if (data.disambiguation) {
				attributes.push({
					key: "disambiguation",
					value: data.disambiguation,
				});
			}
		}

		return { attributes };
	}

	async getAlbumAttributeValues(
		helper: AlbumInformationHelper,
	): Promise<AlbumMetadata> {
		const releaseGroupId = await helper.getIdentity(
			"musicbrainz_release_group_id",
		);

		if (!releaseGroupId) {
			return {
				attributes: null,
				artists: null,
			};
		}

		const releaseGroup = await requestMusicBrainz<MusicBrainzReleaseGroup>(
			`/release-group/${releaseGroupId.identity}`,
			this.logger,
			["artist-credits", "annotation", "tags", "genres"],
		);

		const attributes: AttributeValue[] = [
			{
				key: "title",
				value: releaseGroup.title,
			},
		];

		if (releaseGroup["first-release-date"]) {
			attributes.push({
				key: "year",
				value: new Date(releaseGroup["first-release-date"]).getUTCFullYear(),
			});
		}

		let isVariousArtists = false;
		const artists: IdentifiableTrackArtistMetadata[] = [];
		if (releaseGroup["artist-credit"]) {
			for (const credit of releaseGroup["artist-credit"]) {
				const artist = credit.artist;

				if (artist?.id) {
					if (artist.id == VARIOUS_ARTISTS_UUID) {
						if (!isVariousArtists) {
							isVariousArtists = true;
							attributes.push({
								key: "artist",
								value: "Various Artists",
							});
						}
					} else {
						artists.push({
							identityId: "musicbrainz_artist_id",
							identity: artist.id,
							joinPhrase: credit.joinphrase ?? null,
							attributes: [{ key: "name", value: artist.name }],
							pluginId: releaseGroupId.pluginId,
						});
					}
				}
			}
		}

		return {
			attributes,
			artists,
		};
	}
}
