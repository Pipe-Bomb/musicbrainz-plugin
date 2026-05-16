import { ConfigManager, ConfigNode } from "@sdk";

export class MusicBrainzConfigManager implements ConfigManager {
	getConfigOptions(): ConfigNode {
		return {
			type: "section",
			children: [
				{
					type: "text",
					id: "acoustid_client_id",
					name: "AcoustID Client ID",
					placeholder: "XXXXXXXXXX",
				},
			],
		};
	}
}
