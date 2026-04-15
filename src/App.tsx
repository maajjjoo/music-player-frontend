import { useCallback, useState, useEffect, useMemo } from 'react';
import type { Song } from './models/Song';
import { usePlaylist } from './hooks/usePlaylist';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { Vinyl } from './components/Vinyl/Vinyl';
import { CoverShelf } from './components/CoverShelf/CoverShelf';
import { SearchBar } from './components/SearchBar/SearchBar';
import { LocalUploader } from './components/LocalUploader/LocalUploader';
import './App.css';

export default function App() {
  const playlist = usePlaylist();
  const [bgColor, setBgColor] = useState('#f0ece6');

  const handleSongEnded = useCallback(() => {
    if (playlist.repeatMode === 'one') {
      // Repeat current song - just replay without reloading
      player.replay();
    } else if (playlist.repeatMode === 'all') {
      // Play next song (will wrap to start)
      const next = playlist.playNext();
      if (next?.song.previewUrl) player.play(next.song.previewUrl);
    } else {
      // repeatMode === 'none'
      // Only play next if there is a next song
      const currentIndex = playlist.songs.findIndex(
        (n) => n.song.id === playlist.currentSong?.song.id
      );
      if (currentIndex < playlist.songs.length - 1) {
        const next = playlist.playNext();
        if (next?.song.previewUrl) player.play(next.song.previewUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist.repeatMode, playlist.currentSong, playlist.songs]);

  const player = useAudioPlayer(handleSongEnded);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  }, []);

  // Removed automatic song loading - user must search and add songs

  function handlePlaySong(id: string) {
    playlist.playSong(id);
    const node = playlist.songs.find((n) => n.song.id === id);
    if (node?.song.previewUrl) player.play(node.song.previewUrl);
  }

  function handlePlayNow(song: Song) {
    playlist.addToEnd(song);
    playlist.playSong(song.id);
    if (song.previewUrl) player.play(song.previewUrl);
    showNotification(`✓ ${song.title} added to queue`);
  }

  function handleAddToQueue(song: Song) {
    playlist.addToEnd(song);
    showNotification(`✓ ${song.title} added to queue`);
  }

  function handleNext() {
    const next = playlist.playNext();
    if (next?.song.previewUrl) player.play(next.song.previewUrl);
  }

  function handlePrev() {
    const prev = playlist.playPrev();
    if (prev?.song.previewUrl) player.play(prev.song.previewUrl);
  }

  // Always show all songs in queue, regardless of search query
  const allSongs = playlist.songs;

  // Save volume to localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('vinyl-volume');
    if (savedVolume) {
      player.setVolume(parseFloat(savedVolume));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vinyl-volume', player.volume.toString());
  }, [player.volume]);

  // Remove unused memoizedHandlers for now
  // const memoizedHandlers = useMemo(() => ({
  //   handleNext,
  //   handlePrev,
  //   handlePlaySong,
  //   handleAddToQueue,
  //   handlePlayNow,
  // }), [handleNext, handlePrev, handlePlaySong, handleAddToQueue, handlePlayNow]);

  // Memoize keyboard shortcuts
  const keyboardShortcuts = useMemo(() => ({
    onPlayPause: player.togglePlay,
    onNext: handleNext,
    onPrev: handlePrev,
    onVolumeUp: () => player.setVolume(Math.min(1, player.volume + 0.1)),
    onVolumeDown: () => player.setVolume(Math.max(0, player.volume - 0.1)),
  }), [player.togglePlay, handleNext, handlePrev, player.setVolume, player.volume]);

  // Keyboard shortcuts
  useKeyboardShortcuts(keyboardShortcuts);

  return (
    <ErrorBoundary>
      <div
        className="app"
        style={{ '--bg-tint': bgColor } as React.CSSProperties}
      >
      {/* Dynamic tinted background */}
      <div className="app__bg" aria-hidden="true" />

      {/* ── Top search bar ── */}
      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-icon">◉</span>
          <span className="app__brand-name">Vinyl</span>
        </div>
        <div className="app__search-wrap">
          <SearchBar
            query={playlist.searchQuery}
            onQueryChange={playlist.setSearchQuery}
            onAddSong={handleAddToQueue}
            onAddToStart={playlist.addToStart}
            onAddAtPosition={playlist.addAtPosition}
            onPlayNow={handlePlayNow}
            queueSize={playlist.songs.length}
            onNotification={showNotification}
            songs={playlist.songs}
          />
        </div>
        <LocalUploader
          onAddSong={handleAddToQueue}
          onPlayNow={handlePlayNow}
          onNotification={showNotification}
        />
        <div className="app__queue-pill">
          <span>{playlist.songs.length}</span> in queue
        </div>
      </header>

      {/* ── Main stage ── */}
      <main className="app__stage">

        {/* Left: turntable */}
        <section className="app__turntable" aria-label="Now playing">
          <Vinyl
            currentSong={playlist.currentSong}
            isPlaying={player.isPlaying}
            onColorExtracted={setBgColor}
          />
        </section>

        {/* Divider */}
        <div className="app__divider" aria-hidden="true" />

        {/* Right: cover shelf */}
        <section className="app__shelf" aria-label="Queue">
          <div className="app__shelf-header">
            <h2 className="app__shelf-title">Up Next</h2>
          </div>
          <CoverShelf
            songs={allSongs}
            currentSong={playlist.currentSong}
            onPlay={handlePlaySong}
            onRemove={playlist.removeSong}
            onReorder={playlist.reorderSong}
          />
        </section>
      </main>

      {/* ── Bottom Player Bar ── */}
      <footer className="app__player">
        {/* Progress bar at the very top */}
        <div className="app__player-progress-bar">
          <div className="app__player-progress-track" />
          <div className="app__player-progress-fill" style={{ width: `${player.duration > 0 ? (player.position / player.duration) * 100 : 0}%` }} />
          <input
            type="range"
            className="app__player-progress-input"
            min={0}
            max={player.duration || 100}
            value={player.position}
            onChange={(e) => player.seek(Number(e.target.value))}
            aria-label="Seek"
          />
        </div>

        {/* Main controls row */}
        <div className="app__player-main">
          {/* Left: Time */}
          <div className="app__player-time-section">
            <span className="app__player-time">{formatTime(player.position)}</span>
          </div>

          {/* Center: Controls */}
          <div className="app__player-controls">
            <button
              className={`app__player-btn app__player-btn--sm${playlist.isShuffled ? ' app__player-btn--active' : ''}`}
              onClick={playlist.toggleShuffle}
              aria-label="Shuffle"
            >⇄</button>

            <button className="app__player-btn" onClick={handlePrev} aria-label="Previous">⏮</button>

            <button
              className="app__player-btn app__player-btn--play"
              onClick={player.togglePlay}
              aria-label={player.isPlaying ? 'Pause' : 'Play'}
            >
              {player.isPlaying ? '⏸' : '▶'}
            </button>

            <button className="app__player-btn" onClick={handleNext} aria-label="Next">⏭</button>

            <button
              className={`app__player-btn app__player-btn--sm${playlist.repeatMode !== 'none' ? ' app__player-btn--active' : ''}`}
              onClick={playlist.toggleRepeat}
              aria-label="Repeat"
            >
              🔁
              {playlist.repeatMode === 'one' && <span className="app__player-btn-dot" />}
            </button>
          </div>

          {/* Right: Time + Volume */}
          <div className="app__player-right">
            <span className="app__player-time">{formatTime(player.duration)}</span>
            <div className="app__player-volume">
              <span aria-hidden="true">🔈</span>
              <div className="app__player-volume-bar">
                <div className="app__player-volume-track" />
                <div className="app__player-volume-fill" style={{ width: `${player.volume * 100}%` }} />
                <input
                  type="range"
                  className="app__player-volume-input"
                  min={0}
                  max={1}
                  step={0.01}
                  value={player.volume}
                  onChange={(e) => player.setVolume(Number(e.target.value))}
                  aria-label="Volume"
                />
              </div>
              <span aria-hidden="true">🔊</span>
            </div>
          </div>
        </div>
      </footer>

        {notification && (
          <div className="app__notification" role="status" aria-live="polite">
            {notification}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
