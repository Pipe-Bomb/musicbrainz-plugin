# MusicBrainz Plugin

Uses embedded audio tags and [Chromaprint](https://github.com/Pipe-Bomb/chromaprint-plugin) fingerprints to identify tracks. Generates relationships between tracks, artists and albums, and adds attributes to each. Another core functionality of this plugin is to track MusicBrainz artist relations to other services, such as Discogs. If another plugin also manages to link an artist to one of these identities, Pipe Bomb will merge the two profiles.

## Identities

### Track

| Identity                       | Soft Dependencies                         | Link   | Description                                                                                                                                                        |
| :----------------------------- | ----------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `acoustid_id`                  | `chromaprint`                             |        |                                                                                                                                                                    |
| `musicbrainz_artist_id`        | `chromaprint`                             | Artist | The MB artist IDs associated with a track.                                                                                                                         |
| `musicbrainz_recording_id`     | `chromaprint`, `isrc`                     |        | The MB recording ID of a track.                                                                                                                                    |
| `musicbrainz_release_group_id` | `chromaprint`, `musicbrainz_recording_id` | Album  | The MB release group of a track. Since a recording can be featured in hundreds of release groups, the plugin attempts to select the most relevant or original one. |
| `musicbrainz_recording_id`     | `chromaprint`, `musicbrainz_recording_id` |        | The MB recording ID of a track.                                                                                                                                    |

### Album

| Identity                | Soft Dependencies              | Link   | Description                                 |
| :---------------------- | ------------------------------ | ------ | ------------------------------------------- |
| `musicbrainz_artist_id` | `musicbrainz_release_group_id` | Artist | The MB artist IDs associated with an album. |

### Artist

| Identity                      | Soft Dependencies                                  | Hard Dependencies       | Description                                                            |
| :---------------------------- | -------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `discogs_artist_id`           |                                                    | `musicbrainz_artist_id` | The Discogs artist ID associated with the MB artist profile.           |
| `musicbrainz_artist_id`       | `soundcloud_artist_permalink`, `spotify_artist_id` |                         | The MB artist ID associated with a third party profile.                |
| `soundcloud_artist_permalink` |                                                    | `musicbrainz_artist_id` | The SoundCLoud artist permalink associated with the MB artist profile. |
| `spotify_artist_id`           |                                                    | `musicbrainz_artist_id` | The Spotify artist ID associated with the MB artist profile.           |
| `youtube_music_channel_id`    |                                                    | `musicbrainz_artist_id` | The YouTube Music channel ID associated with the MB artist profile.    |
| `youtube_music_handle`        |                                                    | `musicbrainz_artist_id` | The YouTube Music handle associated with the MB artist profile.        |

## MusicBrainz Attributes

### Track

| Attribute  | Type      | Multiple | Description                                  |
| :--------- | --------- | -------- | -------------------------------------------- |
| `title`    | `string`  | ❌       | The title of the track.                      |
| `duration` | `decimal` | ❌       | The duration of the track in seconds.        |
| `rating`   | `decimal` | ❌       | The community rating of the track, out of 5. |
| `genre`    | `string`  | ✅       | The genres of the track.                     |
