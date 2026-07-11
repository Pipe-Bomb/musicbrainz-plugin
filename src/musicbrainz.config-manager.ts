import { ConfigManager, ConfigManagerApiContext, ConfigNode } from "@sdk";

export class MusicBrainzConfigManager implements ConfigManager {
	private api!: ConfigManagerApiContext;

	private acoustIdClientId: string | null = null;
	private ignoredFileTags: string[] = [];

	async enable(configManagerApiContext: ConfigManagerApiContext) {
		this.api = configManagerApiContext;

		this.ignoredFileTags =
			(await this.api.getValue("ignored_file_tags", "string", true)) ?? [];
	}

	async getAcoustIdClientId() {
		if (this.acoustIdClientId === null) {
			this.acoustIdClientId =
				(await this.api.getValue("acoustid_client_id", "string")) ?? "";
		}
		return this.acoustIdClientId;
	}

	isTagIgnored(fileTag: string) {
		return this.ignoredFileTags.includes(fileTag);
	}

	async getConfigOptions(): Promise<ConfigNode> {
		return {
			type: "section",
			children: [
				{
					type: "text",
					id: "acoustid_client_id",
					name: "AcoustID Client ID",
					placeholder: "XXXXXXXXXX",
					value: (await this.getAcoustIdClientId()) ?? "",
				},
				{
					type: "text",
					id: "ignored_file_tags",
					name: "Ignored file tags",
					placeholder: "musicbrainz_artistid,musicbrainz_releasegroupid",
					value: this.ignoredFileTags.join(","),
				},
			],
		};
	}

	async update(values: Record<string, any>): Promise<ConfigNode> {
		const acoustIdClientId = values["acoustid_client_id"];
		if (
			typeof acoustIdClientId == "string" &&
			acoustIdClientId != this.acoustIdClientId
		) {
			if (acoustIdClientId) {
				await this.api.setValue(
					"acoustid_client_id",
					"string",
					acoustIdClientId,
				);
			} else {
				await this.api.delete("acoustid_client_id");
			}
			this.acoustIdClientId = acoustIdClientId;
		}

		const ignoredTagsString = values["ignored_file_tags"];
		if (
			typeof ignoredTagsString == "string" &&
			this.ignoredFileTags.join(",") != ignoredTagsString
		) {
			const tags = ignoredTagsString
				.split(",")
				.map((tag) => tag.trim())
				.filter(Boolean);
			if (tags.length) {
				this.ignoredFileTags = tags;
				await this.api.setValue("ignored_file_tags", "string", tags);
			} else {
				this.ignoredFileTags = [];
				await this.api.delete("ignored_file_tags");
			}
		}

		return this.getConfigOptions();
	}
}
