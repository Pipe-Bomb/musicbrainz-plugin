import { TrackInformationHelper } from "@sdk";
import { IAudioMetadata, parseStream } from "music-metadata";
import { Cache } from "./cache.js";

const cache = new Cache<string, IAudioMetadata>({
	maxEntries: 30,
	timeout: 30_000,
});

export async function getTrackMetadata(helper: TrackInformationHelper) {
	const id = helper.getTrackUuid();
	const existingData = cache.get(id);
	if (existingData) {
		return existingData;
	}

	const producer = await helper.getAudioProducer("stream");
	if (!producer) {
		return null;
	}

	const stream = await producer.getStream();

	const metadata = await parseStream(stream);
	cache.set(id, metadata);
	return metadata;
}
