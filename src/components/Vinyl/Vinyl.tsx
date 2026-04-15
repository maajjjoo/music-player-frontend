import { useEffect, useRef, useState, useCallback } from 'react';
import type { SongNode } from '../../models/Song';
import type { RepeatMode } from '../../hooks/usePlaylist';
import './Vinyl.css';

// ─── Props ────────────────────────────────────────────────────────────────────

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

// ─── Utility: Time Formatter ──────────────────────────────────────────────────

const TimeFormatter = {
  format(ms: number): string {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },
};

// ─── Utility: Color Extractor ─────────────────────────────────────────────────

const ColorExtractor = {
  DEFAULT: 'rgba(167,139,250,0.35)' as string,
  SIZE: 16,

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
      return `rgba(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)},0.35)`;
    } catch {
      return this.DEFAULT;
    }
  },
};

// ─── Utility: Turntable Controller (33⅓ RPM) ─────────────────────────────────

const createTurntableController = (onUpdate: (deg: number) => void) => {
  let deg = 0;
  let rafId = 0;
  let lastTs = 0;
  const SPEED = (33.33 * 360) / (60 * 1000); // deg/ms

  const start = () => {
    const tick = (ts: number) => {
      if (lastTs) {
        deg = (deg + (ts - lastTs) * SPEED) % 360;
        onUpdate(deg);
      }
      lastTs = ts;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  };

  const stop = () => { cancelAnimationFrame(rafId); lastTs = 0; };
  return { start, stop, cleanup: stop };
};

// ─── Hook: Vinyl Rotation ─────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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
      onColorExtracted(ColorExtractor.extract(imgRef.current));
    }
  }, [onColorExtracted]);

  return (
    <div className={`vp${isPlaying ? ' vp--playing' : ''}`}>

      {/* ── Song info above the record ── */}
      <div className="vp__meta" aria-live="polite">
        <h2 className="vp__title">{song?.title ?? 'No track selected'}</h2>
        <p className="vp__artist">{song?.artist ?? 'Choose a song to begin'}</p>
      </div>

      {/* ── Vinyl record ── */}
      <div className="vp__scene">
        {/* Tonearm */}
        <div className={`vp__arm${isPlaying ? ' vp__arm--playing' : ''}`} aria-hidden="true">
          <div className="vp__arm-pivot" />
          <div className="vp__arm-rod" />
          <div className="vp__arm-head" />
        </div>

        {/* Outer glow ring */}
        <div className="vp__glow-ring" aria-hidden="true" />

        {/* The record itself */}
        <div
          className="vp__record"
          style={{ transform: `rotate(${rotation}deg)` }}
          aria-label="Vinyl record"
        >
          {/* Groove rings */}
          <div className="vp__grooves" aria-hidden="true" />

          {/* Sheen overlay */}
          <div className="vp__sheen" aria-hidden="true" />

          {/* Center label */}
          <div className="vp__label">
            {song?.albumArt ? (
              <img
                ref={imgRef}
                src={song.albumArt}
                alt={song.album ?? 'Album art'}
                className="vp__label-art"
                onLoad={handleImgLoad}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="vp__label-empty" aria-hidden="true">♪</div>
            )}
            {/* Gold ring on label */}
            <div className="vp__label-ring" aria-hidden="true" />
          </div>

          {/* Spindle */}
          <div className="vp__spindle" aria-hidden="true" />
        </div>
      </div>

      {/* ── Controls card ── */}
      <div className="vp__card">

        {/* Progress */}
        <div className="vp__progress">
          <span className="vp__time">{TimeFormatter.format(position)}</span>
          <div className="vp__track">
            <div className="vp__track-bg" />
            <div className="vp__track-fill" style={{ width: `${progress}%` }} />
            <input
              type="range"
              className="vp__track-input"
              min={0}
              max={duration || 100}
              value={position}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Seek"
            />
          </div>
          <span className="vp__time">{TimeFormatter.format(duration)}</span>
        </div>

        {/* Transport */}
        <div className="vp__transport" role="group" aria-label="Playback controls">
          <button
            className={`vp__btn vp__btn--ghost${isShuffled ? ' vp__btn--on' : ''}`}
            onClick={onToggleShuffle}
            aria-label="Shuffle"
            title="Shuffle"
          >⇄</button>

          <button className="vp__btn" onClick={onPrev} aria-label="Previous">⏮</button>

          <button
            className="vp__btn vp__btn--play"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span className="vp__btn-play-icon">{isPlaying ? '⏸' : '▶'}</span>
          </button>

          <button className="vp__btn" onClick={onNext} aria-label="Next">⏭</button>

          <button
            className={`vp__btn vp__btn--ghost${repeatMode !== 'none' ? ' vp__btn--on' : ''}`}
            onClick={onToggleRepeat}
            aria-label="Repeat"
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? '🔂' : '🔁'}
          </button>
        </div>

        {/* Volume */}
        <div className="vp__volume" role="group" aria-label="Volume">
          <span className="vp__vol-icon" aria-hidden="true">🔈</span>
          <div className="vp__track vp__track--vol">
            <div className="vp__track-bg" />
            <div className="vp__track-fill" style={{ width: `${volume * 100}%` }} />
            <input
              type="range"
              className="vp__track-input"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>
          <span className="vp__vol-icon" aria-hidden="true">🔊</span>
        </div>
      </div>
    </div>
  );
}
