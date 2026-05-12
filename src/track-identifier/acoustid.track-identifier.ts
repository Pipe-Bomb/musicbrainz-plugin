import { ICommonTagsResult } from "music-metadata";
import { BaseMetadataIdentifier } from "../base-metadata.identifier.js";
import { AcoustIdResult } from "../type/acoustid.js";
import { TrackIdentifierTarget } from "@sdk";

export class AcoustIDTrackIdentifier extends BaseMetadataIdentifier {
	public readonly id = "acoustid_id";
	public readonly target: TrackIdentifierTarget = "track";

	protected tag: keyof ICommonTagsResult = "acoustid_id"; // todo: check this

	protected retrieveFromAcoustId(results: AcoustIdResult[]): string[] | null {
		return Array.from(new Set(results.map((result) => result.id)));
	}
}
