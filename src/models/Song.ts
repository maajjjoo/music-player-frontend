export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in milliseconds
  albumArt: string;
  previewUrl: string | null;
  isFavorite: boolean;
  isLocal?: boolean;       // true for locally uploaded files
  blobUrl?: string;        // blob: URL for local audio (to be revoked on remove)
  artBlobUrl?: string;     // blob: URL for local cover image
}

export interface SongNode {
  song: Song;
  prev: SongNode | null;
  next: SongNode | null;
}
