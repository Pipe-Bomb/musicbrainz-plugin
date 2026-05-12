import { TrackInformationHelper } from "@sdk";
import { Cache } from "./cache.js";

const cache = new Cache<string, number | "404">({
	maxEntries: 30,
	timeout: 30_000,
});

export async function getTrackDuration(helper: TrackInformationHelper) {
	const id = helper.getTrackUuid();
	const existingData = cache.get(id);
	if (existingData) {
		if (existingData == "404") {
			return null;
		}
		return existingData;
	}

	const producer = await helper.getAudioProducer("stream");
	if (!producer) {
		return null;
	}

	const duration = await producer.getDuration();
	cache.set(id, duration ?? "404");
	return duration;
}
