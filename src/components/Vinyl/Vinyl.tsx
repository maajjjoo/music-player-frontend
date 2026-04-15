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

// ─── Utility: Vintage Color Extractor ────────────────────────────────────────

const VintageColorExtractor = {
  DEFAULT: '#f4f1e8' as string,
  SIZE: 12,

  extractWarmTone(img: HTMLImageElement): string {
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
      // Sepia-blend with warm cream
      const sr = Math.min(255, (r / n) * 0.393 + (g / n) * 0.769 + (b / n) * 0.189);
      const sg = Math.min(255, (r / n) * 0.349 + (g / n) * 0.686 + (b / n) * 0.168);
      const sb = Math.min(255, (r / n) * 0.272 + (g / n) * 0.534 + (b / n) * 0.131);
      return `rgb(${Math.floor((sr + 250) * 0.6)},${Math.floor((sg + 247) * 0.6)},${Math.floor((sb + 240) * 0.6)})`;
    } catch {
      return this.DEFAULT;
    }
  },
};

// ─── Utility: Turntable Animation Controller ─────────────────────────────────

const createTurntableController = (onUpdate: (deg: number) => void) => {
  let deg = 0;
  let rafId = 0;
  let lastTs = 0;
  // Classic 33⅓ RPM → degrees per millisecond
  const SPEED = (33.33 * 360) / (60 * 1000);

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

  const stop = () => {
    cancelAnimationFrame(rafId);
    lastTs = 0;
  };

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
      onColorExtracted(VintageColorExtractor.extractWarmTone(imgRef.current));
    }
  }, [onColorExtracted]);

  return (
    <div className={`vt-stage${isPlaying ? ' vt-stage--playing' : ''}`}>

      {/* ── Turntable platter ── */}
      <div className="vt-platter">

        {/* Tonearm */}
        <div className={`vt-arm${isPlaying ? ' vt-arm--playing' : ''}`}>
          <div className="vt-arm__pivot" />
          <div className="vt-arm__rod" />
          <div className="vt-arm__head" />
        </div>

        {/* Spinning record */}
        <div
          className="vt-record"
          style={{ transform: `rotate(${rotation}deg)` }}
          aria-label="Vinyl record"
        >
          <div className="vt-record__grooves" />

          {/* Center label */}
          <div className="vt-label">
            {song?.albumArt ? (
              <img
                ref={imgRef}
                src={song.albumArt}
                alt={song.album ?? 'Album art'}
                className="vt-label__art"
                onLoad={handleImgLoad}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="vt-label__art vt-label__art--empty">
                <span aria-hidden="true">♪</span>
              </div>
            )}

            {/* Song info pill — rotates with record, readable because it's small */}
            <div className="vt-label__info" aria-live="polite">
              <span className="vt-label__title">{song?.title ?? 'Select a record'}</span>
              <span className="vt-label__artist">{song?.artist ?? ''}</span>
            </div>
          </div>

          <div className="vt-record__spindle" aria-hidden="true" />
        </div>

        {/* Ambient glow when playing */}
        {isPlaying && <div className="vt-platter__glow" aria-hidden="true" />}
      </div>

      {/* ── Controls card ── */}
      <div className="vt-controls">

        {/* Progress */}
        <div className="vt-progress">
          <span className="vt-progress__time">{TimeFormatter.format(position)}</span>
          <div className="vt-progress__track" role="presentation">
            <div className="vt-progress__fill" style={{ width: `${progress}%` }} />
            <input
              type="range"
              className="vt-progress__input"
              min={0}
              max={duration || 100}
              value={position}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Seek"
            />
          </div>
          <span className="vt-progress__time">{TimeFormatter.format(duration)}</span>
        </div>

        {/* Transport */}
        <div className="vt-transport" role="group" aria-label="Playback controls">
          <button
            className={`vt-btn vt-btn--sm${isShuffled ? ' vt-btn--active' : ''}`}
            onClick={onToggleShuffle}
            aria-label="Shuffle"
            title="Shuffle"
          >⇄</button>

          <button
            className="vt-btn"
            onClick={onPrev}
            aria-label="Previous track"
          >⏮</button>

          <button
            className="vt-btn vt-btn--play"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button
            className="vt-btn"
            onClick={onNext}
            aria-label="Next track"
          >⏭</button>

          <button
            className={`vt-btn vt-btn--sm${repeatMode !== 'none' ? ' vt-btn--active' : ''}`}
            onClick={onToggleRepeat}
            aria-label="Repeat"
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? '🔂' : '🔁'}
          </button>
        </div>

        {/* Volume */}
        <div className="vt-volume" role="group" aria-label="Volume">
          <span aria-hidden="true" className="vt-volume__icon">🔈</span>
          <div className="vt-volume__track" role="presentation">
            <div
              className="vt-volume__fill"
              style={{ width: `${volume * 100}%` }}
            />
            <input
              type="range"
              className="vt-volume__input"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>
          <span aria-hidden="true" className="vt-volume__icon">🔊</span>
        </div>
      </div>
    </div>
  );
}
