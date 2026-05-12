export type AcoustIdLookupResponse =
	| {
			status: "ok";
			results: AcoustIdResult[];
	  }
	| {
			status: "error";
			error?: {
				code: number;
				message: string;
			};
	  };

export interface AcoustIdResult {
	id: string;
	score: number;
	recordings?: AcoustIdRecording[];
}

export interface AcoustIdRecording {
	id: string;
	title?: string;
	duration?: number;
	artists?: AcoustIdArtist[];
	// Important: releasegroups is the container in the modern API
	releasegroups?: AcoustIdReleaseGroup[];
}

export interface AcoustIdReleaseGroup {
	id: string;
	title?: string;
	type?: string;
	secondarytypes?: string[];
	artists?: AcoustIdArtist[];
	releases?: AcoustIdRelease[]; // Releases live here!
}

export interface AcoustIdRelease {
	id: string;
	title?: string;
	date?: {
		year?: number;
		month?: number;
		day?: number;
	};
	country?: string;
	medium_count?: number;
	track_count?: number;
}

export interface AcoustIdArtist {
	id: string;
	name: string;
	joinphrase?: string;
}
