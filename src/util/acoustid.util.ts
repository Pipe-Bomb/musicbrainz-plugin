import { AcoustIdResult } from "../type/acoustid.js";

export function getBestAcoustIdRecording(
	results: AcoustIdResult[],
	duration: number,
) {
	let bestRecording = null;
	let minDelta = Infinity;

	for (const res of results) {
		for (const rec of res.recordings ?? []) {
			if (!rec.id) continue;

			if (rec.duration) {
				const delta = Math.abs(rec.duration - duration);
				if (delta < minDelta) {
					minDelta = delta;
					bestRecording = rec;
				}
			} else if (!bestRecording) {
				bestRecording = rec;
			}
		}
	}

	return bestRecording;
}
