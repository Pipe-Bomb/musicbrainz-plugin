import {
	AlbumInformationHelper,
	AlbumMetadata,
	ArtistInformationHelper,
	ArtistMetadata,
	AttributeSource,
	AttributeSourceApiContext,
	AttributeValue,
	Logger,
	TrackInformationHelper,
	TrackMetadata,
} from "@sdk";
import Axios, { AxiosError } from "axios";
import {
	CoverArtArchiveResponse,
	CoverArtImage,
} from "../type/cover-art-archive.js";
import { USER_AGENT } from "../constants.js";
import path from "path";

export class CoverArtArchiveAttributeSource implements AttributeSource {
	public id = "cover-art-archive";
	private api!: AttributeSourceApiContext;
	private logger!: Logger;

	enable(attributeSourceApiContext: AttributeSourceApiContext): void {
		this.api = attributeSourceApiContext;
		this.logger = this.api.getLogger();

		this.api.registerTrackAttributes([
			{
				key: "front",
				type: "buffer",
				supportsMultiple: false,
			},
			{
				key: "back",
				type: "buffer",
				supportsMultiple: false,
			},
		]);

		this.api.registerAlbumAttributes([
			{
				key: "front",
				type: "buffer",
				supportsMultiple: false,
			},
			{
				key: "back",
				type: "buffer",
				supportsMultiple: false,
			},
		]);
	}

	getName() {
		return "Cover Art Archive";
	}

	private async requestCoverArt(
		type: "release" | "release-group",
		releaseId: string,
	) {
		const request = async () => {
			const { data } = await Axios.get<CoverArtArchiveResponse>(
				`https://coverartarchive.org/${type}/${releaseId}`,
				{
					family: 4,
					headers: {
						"User-Agent": USER_AGENT,
					},
				},
			);
			return data;
		};
		try {
			return request();
		} catch (e) {
			if (e instanceof AxiosError && e.response?.status == 500) {
				return request();
			}
			throw e;
		}
	}

	private async toAttribute(
		images: CoverArtImage[],
		key: string,
		predicate: (image: CoverArtImage) => boolean,
	): Promise<AttributeValue | null> {
		const image = images.find(predicate);
		if (image) {
			const response = await Axios.get<Buffer>(image.image, {
				family: 4,
				headers: {
					"User-Agent": USER_AGENT,
				},
				responseType: "arraybuffer",
			});

			return {
				key,
				value: {
					extension: path.extname(image.image).substring(1),
					buffer: response.data,
				},
			};
		}

		return null;
	}

	async getTrackAttributeValues(
		helper: TrackInformationHelper,
	): Promise<TrackMetadata> {
		const releaseGroupIdentity = await helper.getIdentity(
			"musicbrainz_release_group_id",
		);
		const trackAttributePromises: Promise<AttributeValue | null>[] = [];

		if (releaseGroupIdentity) {
			try {
				const { images } = await this.requestCoverArt(
					"release-group",
					releaseGroupIdentity.identity,
				);

				trackAttributePromises.push(
					this.toAttribute(images, "front", (image) => image.front),
				);
				trackAttributePromises.push(
					this.toAttribute(images, "back", (image) => image.back),
				);
			} catch (e) {
				if (e instanceof AxiosError && e.response?.status == 404) {
					return {
						artists: null,
						attributes: null,
					};
				}
				throw e;
			}
		}

		const trackAttributes = await Promise.allSettled(trackAttributePromises);

		return {
			attributes: trackAttributes
				.filter((attribute) => attribute.status == "fulfilled")
				.map((attribute) => attribute.value)
				.filter((value) => !!value),
			artists: null,
		};
	}

	async getArtistAttributeValues(
		_helper: ArtistInformationHelper,
	): Promise<ArtistMetadata> {
		return {
			attributes: null,
		};
	}

	async getAlbumAttributeValues(
		helper: AlbumInformationHelper,
	): Promise<AlbumMetadata> {
		const releaseGroupIdentity = await helper.getIdentity(
			"musicbrainz_release_group_id",
		);

		const albumAttributePromises: Promise<AttributeValue | null>[] = [];

		if (releaseGroupIdentity) {
			try {
				const { images } = await this.requestCoverArt(
					"release-group",
					releaseGroupIdentity.identity,
				);

				albumAttributePromises.push(
					this.toAttribute(images, "front", (image) => image.front),
				);
				albumAttributePromises.push(
					this.toAttribute(images, "back", (image) => image.back),
				);
			} catch (e) {
				if (e instanceof AxiosError && e.response?.status == 404) {
					return {
						attributes: null,
						artists: null,
					};
				}
				throw e;
			}
		}

		const albumAttributes = await Promise.allSettled(albumAttributePromises);

		return {
			attributes: albumAttributes
				.filter((attribute) => attribute.status == "fulfilled")
				.map((attribute) => attribute.value)
				.filter((value) => !!value),
			artists: null,
		};
	}
}
