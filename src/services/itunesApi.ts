import type { Song } from '../models/Song';

const ITUNES_API_BASE = 'https://itunes.apple.com';

interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  trackTimeMillis: number;
  artworkUrl100: string;
  previewUrl: string | null;
  kind: string;
}

interface ItunesSearchResult {
  resultCount: number;
  results: ItunesTrack[];
}

function mapTrackToSong(track: ItunesTrack): Song {
  return {
    id: String(track.trackId),
    title: track.trackName,
    artist: track.artistName,
    album: track.collectionName ?? '',
    duration: Math.floor((track.trackTimeMillis ?? 0) / 1000),
    albumArt: track.artworkUrl100?.replace('100x100', '300x300') ?? '',
    previewUrl: track.previewUrl ?? null,
    isFavorite: false,
  };
}

export async function searchTracks(query: string): Promise<Song[]> {
  const params = new URLSearchParams({
    term: query,
    media: 'music',
    entity: 'song',
    limit: '20',
  });

  const response = await fetch(`${ITUNES_API_BASE}/search?${params}`);
  if (!response.ok) throw new Error(`iTunes API error: ${response.status}`);

  const data = (await response.json()) as ItunesSearchResult;
  return data.results
    .filter((t) => t.kind === 'song' && t.previewUrl)
    .map(mapTrackToSong);
}

export async function getDefaultSongs(): Promise<Song[]> {
  // Load a mix of popular songs as default playlist
  const queries = ['pop hits 2024', 'latin hits', 'reggaeton'];
  const query = queries[Math.floor(Math.random() * queries.length)];
  return searchTracks(query);
}
