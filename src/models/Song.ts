export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  albumArt: string;
  uri: string; // Spotify URI for playback e.g. spotify:track:xxx
  isFavorite: boolean;
}

export interface SongNode {
  song: Song;
  prev: SongNode | null;
  next: SongNode | null;
}
