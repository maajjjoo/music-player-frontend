export interface SongNode {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  isFavorite: boolean;
  albumArt?: string;
  prev: SongNode | null;
  next: SongNode | null;
}

export type SongData = Omit<SongNode, 'prev' | 'next'>;
