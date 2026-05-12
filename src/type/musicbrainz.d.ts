/**
 * Combined MusicBrainz Type Definitions for PipeBomb
 * Includes Recording Search and Detailed Artist Lookup
 */

export interface MusicBrainzRecordingResponse {
	id: string;
	title: string;
	/** Length of the track in milliseconds. Can be null or missing if unknown. */
	length?: number | null;
	disambiguation?: string;
	video?: boolean;
	/** Format: YYYY, YYYY-MM, or YYYY-MM-DD */
	"first-release-date"?: string;
	"artist-credit"?: MusicBrainzArtistCredit[];
	rating?: MusicBrainzRating;
	genres?: MusicBrainzGenre[];
}

export interface MusicBrainzMultipleResourceResponse {
	"url-count": number;
	urls: MusicBrainzResource[];
}

export interface MusicBrainzArtistCredit {
	/** The name as credited specifically on this recording (e.g., "Snoop Lion" instead of "Snoop Dogg") */
	name: string;
	/** The string used to join this artist with the next one (e.g., " feat. ", " & ") */
	joinphrase?: string;
	artist: MusicBrainzArtist;
}

export interface MusicBrainzArtist {
	id: string;
	name: string;
	"sort-name": string;
	disambiguation?: string;

	/** e.g., "Person", "Group", "Character", "Orchestra" */
	type?: string | null;
	"type-id"?: string | null;

	gender?: string | null;
	"gender-id"?: string | null;

	/** ISO 3166-1 alpha-2 country code (e.g., "US", "GB") */
	country?: string | null;
	area?: MusicBrainzArea | null;
	"begin-area"?: MusicBrainzArea | null;
	"end-area"?: MusicBrainzArea | null;

	"life-span"?: MusicBrainzLifeSpan;
	aliases?: MusicBrainzAlias[];
	isnis?: string[];
	ipis?: string[];

	genres?: MusicBrainzGenre[];
	tags?: MusicBrainzTag[];
	rating?: MusicBrainzRating;

	/** Text notes about the artist */
	annotation?: string | null;

	/** Relationships (External links, member-of, labels, etc.) */
	relations?: MusicBrainzRelation[];
}

export interface MusicBrainzResource {
	id: string;
	resource: string;
	relations?: MusicBrainzRelation[];
}

export interface MusicBrainzRelation {
	type: string;
	"type-id": string;
	direction: "forward" | "backward";
	/** The entity type on the other side of the relation */
	"target-type": "url" | "artist" | "label" | "place" | "area" | "event";
	"target-credit"?: string;
	"source-credit"?: string;

	ended: boolean;
	begin: string | null;
	end: string | null;

	attributes: string[];
	/** KV pairs for specific relation metadata (like performance times at festivals) */
	"attribute-values": Record<string, string>;
	"attribute-ids": Record<string, string>;

	/** Present if target-type is "url" */
	url?: {
		id: string;
		resource: string;
	};
	/** Present if target-type is "artist" */
	artist?: MusicBrainzArtist;
	/** Present if target-type is "label" */
	label?: MusicBrainzLabel;
	/** Present if target-type is "event" */
	event?: MusicBrainzEvent;
}

export interface MusicBrainzEvent {
	id: string;
	name: string;
	type: string | null;
	"type-id": string | null;
	disambiguation: string;
	time: string;
	cancelled: boolean;
	setlist: string;
	"life-span": MusicBrainzLifeSpan;
}

export interface MusicBrainzLabel {
	id: string;
	name: string;
	"sort-name": string;
	type: string | null;
	"type-id": string | null;
	disambiguation: string;
	"label-code": number | null;
}

export interface MusicBrainzArea {
	id: string;
	name: string;
	"sort-name": string;
	type: string | null;
	"type-id": string | null;
	"iso-3166-1-codes"?: string[];
	disambiguation: string;
}

export interface MusicBrainzLifeSpan {
	begin?: string | null;
	end?: string | null;
	ended: boolean;
}

export interface MusicBrainzAlias {
	name: string;
	"sort-name": string;
	type?: string;
	"type-id"?: string;
	locale?: string | null;
	primary?: boolean | null;
	"begin-date"?: string | null;
	"end-date"?: string | null;
}

export interface MusicBrainzGenre {
	id: string;
	name: string;
	/** The number of votes/weight this genre has in the MB database */
	count?: number;
	disambiguation?: string;
}

export interface MusicBrainzTag {
	name: string;
	count: number;
}

export interface MusicBrainzRating {
	/** 0 to 5 scale */
	value: number | null;
	"votes-count": number;
}
