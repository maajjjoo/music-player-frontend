import { SongNode } from '../../models/Song';

interface SongItemProps {
  node: SongNode;
  isActive: boolean;
  onPlay: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SongItem({
  node,
  isActive,
  onPlay,
  onRemove,
  onToggleFavorite,
}: SongItemProps) {
  const { song } = node;

  return (
    <li className={`song-item ${isActive ? 'song-item--active' : ''}`}>
      <button
        className="song-item__play-area"
        onClick={() => onPlay(song.id)}
        aria-label={`Play ${song.title}`}
      >
        <img
          className="song-item__art"
          src={song.albumArt}
          alt={song.album}
        />
        <div className="song-item__info">
          <span className="song-item__title">{song.title}</span>
          <span className="song-item__artist">{song.artist}</span>
        </div>
      </button>

      <span className="song-item__album">{song.album}</span>
      <span className="song-item__duration">{formatDuration(song.duration)}</span>

      <div className="song-item__actions">
        <button
          className={`song-item__btn ${song.isFavorite ? 'song-item__btn--favorite' : ''}`}
          onClick={() => onToggleFavorite(song.id)}
          aria-label={song.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={song.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {song.isFavorite ? '♥' : '♡'}
        </button>
        <button
          className="song-item__btn song-item__btn--remove"
          onClick={() => onRemove(song.id)}
          aria-label={`Remove ${song.title}`}
          title="Remove from playlist"
        >
          ✕
        </button>
      </div>
    </li>
  );
}
