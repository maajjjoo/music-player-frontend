export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  albumArt: string;
  previewUrl: string | null; // 30-second preview from iTunes
  isFavorite: boolean;
}

export interface SongNode {
  song: Song;
  prev: SongNode | null;
  next: SongNode | null;
}
