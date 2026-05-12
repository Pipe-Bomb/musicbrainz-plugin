import {
	ArtistInformationHelper,
	AttributeSource,
	AttributeSourceApiContext,
	AttributeValue,
	Logger,
	TrackAttributes,
	TrackInformationHelper,
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
	}

	getName() {
		return "Cover Art Archive";
	}

	private async requestCoverArt(releaseId: string) {
		const request = async () => {
			const { data } = await Axios.get<CoverArtArchiveResponse>(
				`https://coverartarchive.org/release/${releaseId}`,
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

	private async toTrackAttribute(
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
					data: response.data,
				},
			};
		}

		return null;
	}

	async getTrackAttributeValues(
		helper: TrackInformationHelper,
	): Promise<TrackAttributes> {
		const releaseIdentity = await helper.getIdentity("musicbrainz_release_id");
		const trackAttributePromises: Promise<AttributeValue | null>[] = [];

		if (releaseIdentity) {
			try {
				const { images } = await this.requestCoverArt(releaseIdentity.value);

				trackAttributePromises.push(
					this.toTrackAttribute(images, "front", (image) => image.front),
				);
				trackAttributePromises.push(
					this.toTrackAttribute(images, "back", (image) => image.back),
				);
			} catch (e) {
				if (e instanceof AxiosError && e.response?.status == 404) {
					return {
						artists: null,
						track: null,
					};
				}
				throw e;
			}
		}

		const trackAttributes = await Promise.allSettled(trackAttributePromises);

		return {
			track: trackAttributes
				.filter((attribute) => attribute.status == "fulfilled")
				.map((attribute) => attribute.value)
				.filter((value) => !!value),
			artists: null,
		};
	}

	async getArtistAttributeValues(
		helper: ArtistInformationHelper,
	): Promise<AttributeValue[]> {
		return [];
	}
}
