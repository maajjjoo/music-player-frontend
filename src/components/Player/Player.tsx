import { SongNode } from '../../models/Song';
import { RepeatMode } from '../../hooks/usePlaylist';
import './Player.css';

interface PlayerProps {
  currentSong: SongNode | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (position: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
}

function formatTime(seconds: number): string {
  const ms = Math.floor(seconds / 1000);
  const m = Math.floor(ms / 60);
  const s = ms % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Player({
  currentSong,
  isPlaying,
  position,
  duration,
  volume,
  repeatMode,
  isShuffled,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleRepeat,
  onToggleShuffle,
}: PlayerProps) {
  const song = currentSong?.song;
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <footer className="player">
      <div className="player__song-info">
        {song ? (
          <>
            <img
              className="player__album-art"
              src={song.albumArt}
              alt={song.album}
            />
            <div className="player__meta">
              <span className="player__title">{song.title}</span>
              <span className="player__artist">{song.artist}</span>
            </div>
          </>
        ) : (
          <div className="player__meta">
            <span className="player__title">No song selected</span>
          </div>
        )}
      </div>

      <div className="player__controls">
        <button
          className={`player__btn ${isShuffled ? 'player__btn--active' : ''}`}
          onClick={onToggleShuffle}
          aria-label="Shuffle"
          title="Shuffle"
        >
          ⇄
        </button>
        <button className="player__btn" onClick={onPrev} aria-label="Previous">
          ⏮
        </button>
        <button
          className="player__btn player__btn--play"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="player__btn" onClick={onNext} aria-label="Next">
          ⏭
        </button>
        <button
          className={`player__btn ${repeatMode !== 'none' ? 'player__btn--active' : ''}`}
          onClick={onToggleRepeat}
          aria-label="Repeat"
          title={`Repeat: ${repeatMode}`}
        >
          {repeatMode === 'one' ? '🔂' : '🔁'}
        </button>
      </div>

      <div className="player__progress-section">
        <span className="player__time">{formatTime(position)}</span>
        <input
          className="player__progress"
          type="range"
          min={0}
          max={duration || 100}
          value={position}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Seek"
        />
        <span className="player__time">{formatTime(duration)}</span>
      </div>

      <div className="player__volume">
        <span aria-hidden="true">🔈</span>
        <input
          className="player__volume-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          aria-label="Volume"
        />
        <span aria-hidden="true">🔊</span>
      </div>

      <div className="player__progress-bar">
        <div className="player__progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </footer>
  );
}
