import { useEffect, useRef, useState, useCallback } from 'react';
import type { SongNode } from '../../models/Song';
import type { RepeatMode } from '../../hooks/usePlaylist';
import './Vinyl.css';

interface VinylProps {
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
  onColorExtracted: (color: string) => void;
}

// ── Utility: Time Formatter ───────────────────────────────────────────────────
const TimeFormatter = {
  format(ms: number): string {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },
};

// ── Utility: Dominant Color Extractor ────────────────────────────────────────
const DominantColorExtractor = {
  SIZE: 20,
  DEFAULT: '#e8e0d8',

  extract(img: HTMLImageElement): string {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.SIZE;
      canvas.height = this.SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return this.DEFAULT;
      ctx.drawImage(img, 0, 0, this.SIZE, this.SIZE);
      const data = ctx.getImageData(0, 0, this.SIZE, this.SIZE).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2];
      }
      const n = data.length / 4;
      // Lighten toward white for a soft background tint
      const lr = Math.round((r / n) * 0.35 + 255 * 0.65);
      const lg = Math.round((g / n) * 0.35 + 255 * 0.65);
      const lb = Math.round((b / n) * 0.35 + 255 * 0.65);
      return `rgb(${lr},${lg},${lb})`;
    } catch {
      return this.DEFAULT;
    }
  },
};

// ── Utility: Turntable Controller (33⅓ RPM) ──────────────────────────────────
const createTurntableController = (onUpdate: (deg: number) => void) => {
  let deg = 0;
  let rafId = 0;
  let lastTs = 0;
  const SPEED = (33.33 * 360) / (60 * 1000);

  const start = () => {
    const tick = (ts: number) => {
      if (lastTs) deg = (deg + (ts - lastTs) * SPEED) % 360;
      lastTs = ts;
      onUpdate(deg);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  };

  const stop = () => { cancelAnimationFrame(rafId); lastTs = 0; };
  return { start, stop, cleanup: stop };
};

// ── Hook: Vinyl Rotation ──────────────────────────────────────────────────────
function useVinylRotation(isPlaying: boolean): number {
  const [rotation, setRotation] = useState(0);
  const ctrlRef = useRef<ReturnType<typeof createTurntableController> | null>(null);

  useEffect(() => {
    ctrlRef.current = createTurntableController(setRotation);
    return () => ctrlRef.current?.cleanup();
  }, []);

  useEffect(() => {
    if (isPlaying) ctrlRef.current?.start();
    else ctrlRef.current?.stop();
  }, [isPlaying]);

  return rotation;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Vinyl({
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
  onColorExtracted,
}: VinylProps) {
  const song = currentSong?.song;
  const imgRef = useRef<HTMLImageElement>(null);
  const rotation = useVinylRotation(isPlaying);
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const handleImgLoad = useCallback(() => {
    if (imgRef.current) {
      onColorExtracted(DominantColorExtractor.extract(imgRef.current));
    }
  }, [onColorExtracted]);

  return (
    <div className={`vt${isPlaying ? ' vt--playing' : ''}`}>

      {/* ── Song info ── */}
      <div className="vt__meta" aria-live="polite">
        <h2 className="vt__title">{song?.title ?? 'No track selected'}</h2>
        <p className="vt__artist">{song?.artist ?? 'Search for a song to begin'}</p>
      </div>

      {/* ── Turntable scene ── */}
      <div className="vt__scene">

        {/* Tonearm */}
        <div className={`vt__arm${isPlaying ? ' vt__arm--on' : ''}`} aria-hidden="true">
          <div className="vt__arm-pivot" />
          <div className="vt__arm-rod" />
          <div className="vt__arm-head" />
        </div>

        {/* Platter base */}
        <div className="vt__platter" aria-hidden="true" />

        {/* Spinning record */}
        <div
          className="vt__record"
          style={{ transform: `rotate(${rotation}deg)` }}
          aria-label="Vinyl record"
        >
          <div className="vt__grooves" aria-hidden="true" />
          <div className="vt__sheen"  aria-hidden="true" />

          {/* Center label */}
          <div className="vt__label">
            {song?.albumArt ? (
              <img
                ref={imgRef}
                src={song.albumArt}
                alt={song.album ?? 'Album art'}
                className="vt__label-art"
                onLoad={handleImgLoad}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="vt__label-empty" aria-hidden="true">♪</div>
            )}
          </div>

          <div className="vt__spindle" aria-hidden="true" />
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="vt__controls">

        {/* Progress */}
        <div className="vt__progress">
          <span className="vt__time">{TimeFormatter.format(position)}</span>
          <div className="vt__bar">
            <div className="vt__bar-track" />
            <div className="vt__bar-fill" style={{ width: `${progress}%` }} />
            <input
              type="range"
              className="vt__bar-input"
              min={0}
              max={duration || 100}
              value={position}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Seek"
            />
          </div>
          <span className="vt__time">{TimeFormatter.format(duration)}</span>
        </div>

        {/* Transport */}
        <div className="vt__transport" role="group" aria-label="Playback controls">
          <button
            className={`vt__btn vt__btn--sm${isShuffled ? ' vt__btn--lit' : ''}`}
            onClick={onToggleShuffle}
            aria-label="Shuffle"
            title="Shuffle"
          >⇄</button>

          <button className="vt__btn" onClick={onPrev} aria-label="Previous">⏮</button>

          <button
            className="vt__btn vt__btn--play"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button className="vt__btn" onClick={onNext} aria-label="Next">⏭</button>

          <button
            className={`vt__btn vt__btn--sm${repeatMode !== 'none' ? ' vt__btn--lit' : ''}`}
            onClick={onToggleRepeat}
            aria-label="Repeat"
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? '🔂' : '🔁'}
          </button>
        </div>

        {/* Volume */}
        <div className="vt__volume" role="group" aria-label="Volume">
          <span className="vt__vol-icon" aria-hidden="true">🔈</span>
          <div className="vt__bar vt__bar--vol">
            <div className="vt__bar-track" />
            <div className="vt__bar-fill" style={{ width: `${volume * 100}%` }} />
            <input
              type="range"
              className="vt__bar-input"
              min={0} max={1} step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>
          <span className="vt__vol-icon" aria-hidden="true">🔊</span>
        </div>
      </div>
    </div>
  );
}
