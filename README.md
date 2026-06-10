<h1>
    <img src="https://raw.githubusercontent.com/Pipe-Bomb/.github/refs/heads/master/assets/logos/Pipe%20Bomb%20no%20background%20w%20outline.png" width="40" />
    MusicBrainz Plugin
</h1>

Uses embedded audio tags and [Chromaprint](https://github.com/Pipe-Bomb/chromaprint-plugin) fingerprints to identify tracks. Generates relationships between tracks, artists and albums, and adds attributes to each. Another core functionality of this plugin is to track MusicBrainz artist relations to other services, such as Discogs. If another plugin also manages to link an artist to one of these identities, Pipe Bomb will merge the two profiles.

## Installation

Clone the repo into your [Pipe Bomb server's](https://github.com/pipe-bomb/server) `plugins` directory. Then inside, run:

```bash
npm ci
npm run build
```

## Usage

In order to convert Chromaprint fingerprints to MusicBrainz IDs, you need to specify an AcoustID client ID. You can get one for free using the [AcoustID website](https://acoustid.org/my-applications).

If you don't have an AcoustID client ID, the plugin will only be able to use MusicBrainz IDs that it locates in audio tags. However using Chromaprint is recommended as a backup because audio tags are often stripped from files that have been transcoded.

## Identities

### Track

| Identity                       | Dependencies                                            | Link   | Description                                                                                                                                                        |
| :----------------------------- | ------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `acoustid_id`                  | `chromaprint` (soft)                                    |        |                                                                                                                                                                    |
| `musicbrainz_artist_id`        | `chromaprint` (soft)                                    | Artist | The MB artist IDs associated with a track.                                                                                                                         |
| `musicbrainz_recording_id`     | `chromaprint` (soft), `isrc` (soft)                     |        | The MB recording ID of a track.                                                                                                                                    |
| `musicbrainz_release_group_id` | `chromaprint` (soft), `musicbrainz_recording_id` (soft) | Album  | The MB release group of a track. Since a recording can be featured in hundreds of release groups, the plugin attempts to select the most relevant or original one. |
| `musicbrainz_recording_id`     | `chromaprint` (soft), `musicbrainz_recording_id` (soft) |        | The MB recording ID of a track.                                                                                                                                    |

### Album

| Identity                | Dependencies                          | Link   | Description                                 |
| :---------------------- | ------------------------------------- | ------ | ------------------------------------------- |
| `musicbrainz_artist_id` | `musicbrainz_release_group_id` (soft) | Artist | The MB artist IDs associated with an album. |

### Artist

| Identity                      | Dependencies                                                     | Description                                                            |
| :---------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `discogs_artist_id`           | `musicbrainz_artist_id` (hard)                                   | The Discogs artist ID associated with the MB artist profile.           |
| `musicbrainz_artist_id`       | `soundcloud_artist_permalink` (soft), `spotify_artist_id` (soft) | The MB artist ID associated with a third party profile.                |
| `soundcloud_artist_permalink` | `musicbrainz_artist_id` (hard)                                   | The SoundCloud artist permalink associated with the MB artist profile. |
| `spotify_artist_id`           | `musicbrainz_artist_id` (hard)                                   | The Spotify artist ID associated with the MB artist profile.           |
| `youtube_music_channel_id`    | `musicbrainz_artist_id` (hard)                                   | The YouTube Music channel ID associated with the MB artist profile.    |
| `youtube_music_handle`        | `musicbrainz_artist_id` (hard)                                   | The YouTube Music handle associated with the MB artist profile.        |

## MusicBrainz Attributes

### Track

| Attribute  | Type      | Multiple | Description                                  |
| :--------- | --------- | -------- | -------------------------------------------- |
| `title`    | `string`  | ❌       | The title of the track.                      |
| `duration` | `decimal` | ❌       | The duration of the track in seconds.        |
| `rating`   | `decimal` | ❌       | The community rating of the track, out of 5. |
| `genre`    | `string`  | ✅       | The genres of the track.                     |

### Artist

| Attribute        | Type     | Multiple | Description                                                                                        |
| :--------------- | -------- | -------- | -------------------------------------------------------------------------------------------------- |
| `name`           | `string` | ❌       | The name of the artist.                                                                            |
| `genre`          | `string` | ✅       | The genres associated with the artist.                                                             |
| `area`           | `string` | ❌       | The area that the artist is most commonly associated with, often a country. _E.g. "United States"_ |
| `area_code`      | `string` | ✅       | The area codes that the artist is most commonly associated with. _E.g. "US"_                       |
| `disambiguation` | `string` | ❌       | Brief explanation that makes the artist distinct from others with similar names.                   |

### Album

| Attribute | Type     | Multiple | Description             |
| :-------- | -------- | -------- | ----------------------- |
| `title`   | `string` | ❌       | The title of the album. |

## Cover Art Archive Attributes

MusicBrainz and the Internet Archive have launched a joint project called the [Cover Art Archive](https://coverartarchive.org), which stores album art with MusicBrainz release group IDs.

### Track

| Attribute | Type             | Multiple | Description                                                                                 |
| :-------- | ---------------- | -------- | ------------------------------------------------------------------------------------------- |
| `front`   | `buffer` (image) | ❌       | The front cover art associated with the track's main release.                               |
| `back`    | `buffer` (image) | ❌       | The back art (found on the back of CD cases, etc) associated with the track's main release. |

### Album

| Attribute | Type             | Multiple | Description                                                                  |
| :-------- | ---------------- | -------- | ---------------------------------------------------------------------------- |
| `front`   | `buffer` (image) | ❌       | The front cover art associated with the album.                               |
| `back`    | `buffer` (image) | ❌       | The back art (found on the back of CD cases, etc) associated with the album. |

## Contributing

The MusicBrainz plugin is primarily developed by [eyezah](https://github.com/eyezahhhh), but contributions are welcome! There are many MusicBrainz data points that have not yet been converted to attributes, and the plugin only integrates with a handful of third party service IDs. If you need more functionality, feel free to PR.
