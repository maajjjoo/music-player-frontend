import { useRef } from 'react';
import type { SongNode } from '../../models/Song';
import './CoverShelf.css';

interface CoverShelfProps {
  songs: SongNode[];
  currentSong: SongNode | null;
  onPlay: (id: string) => void;
  onRemove: (id: string) => void;
}

// Utility: format seconds → m:ss
const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export function CoverShelf({ songs, currentSong, onPlay, onRemove }: CoverShelfProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (songs.length === 0) {
    return (
      <div className="shelf shelf--empty">
        <div className="shelf__empty-icon">♫</div>
        <p className="shelf__empty-text">Search for songs to fill your shelf</p>
      </div>
    );
  }

  return (
    <div className="shelf">
      <div className="shelf__track" ref={trackRef}>
        {songs.map((node) => {
          const { song } = node;
          const isActive = currentSong?.song.id === song.id;

          return (
            <div
              key={song.id}
              className={`shelf__item${isActive ? ' shelf__item--active' : ''}`}
              onClick={() => onPlay(song.id)}
              role="button"
              tabIndex={0}
              aria-label={`Play ${song.title} by ${song.artist}`}
              onKeyDown={(e) => e.key === 'Enter' && onPlay(song.id)}
            >
              {/* Cover art */}
              <div className="shelf__cover-wrap">
                <img
                  className="shelf__cover"
                  src={song.albumArt}
                  alt={song.album}
                  draggable={false}
                />
                {/* Playing indicator overlay */}
                {isActive && (
                  <div className="shelf__playing-badge" aria-hidden="true">
                    <span className="shelf__bar" />
                    <span className="shelf__bar" />
                    <span className="shelf__bar" />
                  </div>
                )}
                {/* Remove button */}
                <button
                  className="shelf__remove"
                  onClick={(e) => { e.stopPropagation(); onRemove(song.id); }}
                  aria-label={`Remove ${song.title}`}
                  title="Remove"
                >✕</button>
              </div>

              {/* Info */}
              <div className="shelf__info">
                <span className="shelf__song-title">{song.title}</span>
                <span className="shelf__song-artist">{song.artist}</span>
                <span className="shelf__song-duration">{formatDuration(song.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
