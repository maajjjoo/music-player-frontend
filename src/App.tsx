import { useEffect, useCallback, useState } from 'react';
import type { Song } from './models/Song';
import { usePlaylist } from './hooks/usePlaylist';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { getDefaultSongs } from './services/itunesApi';
import { Vinyl } from './components/Vinyl/Vinyl';
import { CoverShelf } from './components/CoverShelf/CoverShelf';
import { SearchBar } from './components/SearchBar/SearchBar';
import './App.css';

export default function App() {
  const playlist = usePlaylist();
  const [bgColor, setBgColor] = useState('#f0ece6');

  const handleSongEnded = useCallback(() => {
    const next = playlist.playNext();
    if (next?.song.previewUrl) player.play(next.song.previewUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const player = useAudioPlayer(handleSongEnded);

  useEffect(() => {
    getDefaultSongs()
      .then((songs) => songs.forEach((s) => playlist.addToEnd(s)))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePlaySong(id: string) {
    playlist.playSong(id);
    const node = playlist.songs.find((n) => n.song.id === id);
    if (node?.song.previewUrl) player.play(node.song.previewUrl);
  }

  function handlePlayNow(song: Song) {
    playlist.addToEnd(song);
    playlist.playSong(song.id);
    if (song.previewUrl) player.play(song.previewUrl);
  }

  function handleNext() {
    const next = playlist.playNext();
    if (next?.song.previewUrl) player.play(next.song.previewUrl);
  }

  function handlePrev() {
    const prev = playlist.playPrev();
    if (prev?.song.previewUrl) player.play(prev.song.previewUrl);
  }

  const allSongs = playlist.getFilteredSongs();

  return (
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
            onAddSong={playlist.addToEnd}
            onAddToStart={playlist.addToStart}
            onAddAtPosition={playlist.addAtPosition}
            onPlayNow={handlePlayNow}
            queueSize={playlist.songs.length}
          />
        </div>
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
            position={player.position}
            duration={player.duration}
            volume={player.volume}
            repeatMode={playlist.repeatMode}
            isShuffled={playlist.isShuffled}
            onTogglePlay={player.togglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={player.seek}
            onVolumeChange={player.setVolume}
            onToggleRepeat={playlist.toggleRepeat}
            onToggleShuffle={playlist.toggleShuffle}
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
          />
        </section>
      </main>
    </div>
  );
}
