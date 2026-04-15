import { getValidAccessToken } from './spotifyAuth';
import { Song } from '../models/Song';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

async function apiFetch<T>(endpoint: string): Promise<T> {
  const token = await getValidAccessToken();
  if (!token) throw new Error('No valid access token');

  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
  return response.json() as Promise<T>;
}

interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
  };
}

function mapTrackToSong(track: SpotifyTrack): Song {
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    album: track.album.name,
    duration: Math.floor(track.duration_ms / 1000),
    albumArt: track.album.images[0]?.url ?? '',
    uri: track.uri,
    isFavorite: false,
  };
}

export async function searchTracks(query: string): Promise<Song[]> {
  const params = new URLSearchParams({ q: query, type: 'track', limit: '20' });
  const data = await apiFetch<SpotifySearchResult>(`/search?${params}`);
  return data.tracks.items.map(mapTrackToSong);
}

export async function getRecommendations(): Promise<Song[]> {
  // Get top tracks as seed for recommendations
  const topTracks = await apiFetch<{ items: SpotifyTrack[] }>(
    '/me/top/tracks?limit=5&time_range=short_term'
  );

  if (!topTracks.items.length) return [];

  const seedTracks = topTracks.items
    .slice(0, 5)
    .map((t) => t.id)
    .join(',');

  const data = await apiFetch<{ tracks: SpotifyTrack[] }>(
    `/recommendations?seed_tracks=${seedTracks}&limit=20`
  );

  return data.tracks.map(mapTrackToSong);
}
