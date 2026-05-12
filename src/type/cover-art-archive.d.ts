/**
 * Expected response from https://coverartarchive.org/release/{mbid}
 */
export interface CoverArtArchiveResponse {
	/** The MusicBrainz Release URL this data belongs to */
	release: string;
	/** Array of all images associated with this release */
	images: CoverArtImage[];
}

export interface CoverArtImage {
	/** Internal CAA ID for this specific image */
	id: string;
	/** The direct URL to the original, full-resolution image */
	image: string;
	/** Whether this is marked as the primary 'Front' cover */
	front: boolean;
	/** Whether this is marked as the primary 'Back' cover */
	back: boolean;
	/** MusicBrainz Edit ID that added/updated this image */
	edit: number;
	/** Whether the image has been approved by MusicBrainz voters */
	approved: boolean;
	/** User-provided comment describing the image (e.g. "Limited Edition insert") */
	comment: string;
	/** * Types assigned to the image.
	 * Common values: "Front", "Back", "Booklet", "Medium", "Tray", "Spine", "Track", "Other"
	 */
	types: CoverArtType[];
	/** Direct links to generated thumbnails at various sizes */
	thumbnails: CoverArtThumbnails;
}

export interface CoverArtThumbnails {
	/** ~250px (Small) */
	"250": string;
	/** ~500px (Medium) */
	"500": string;
	/** ~1200px (Large) */
	"1200": string;
	/** Legacy alias for the 500px thumbnail */
	large: string;
	/** Legacy alias for the 250px thumbnail */
	small: string;
}

export type CoverArtType =
	| "Front"
	| "Back"
	| "Booklet"
	| "Medium"
	| "Tray"
	| "Spine"
	| "Track"
	| "Other"
	| "Liner"
	| "Sticker"
	| "Poster"
	| "Watermark";
