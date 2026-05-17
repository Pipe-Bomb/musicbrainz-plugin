import { ConfigManager, ConfigManagerApiContext, ConfigNode } from "@sdk";

export class MusicBrainzConfigManager implements ConfigManager {
	private api!: ConfigManagerApiContext;

	private acoustIdClientId: string | null = null;

	enable(configManagerApiContext: ConfigManagerApiContext): void {
		this.api = configManagerApiContext;
	}

	async getAcoustIdClientId() {
		if (this.acoustIdClientId === null) {
			this.acoustIdClientId =
				(await this.api.getValue("acoustid_client_id", "string")) ?? "";
		}
		return this.acoustIdClientId;
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
		return this.getConfigOptions();
	}
}
