import { useEffect, useCallback, useState } from 'react';
import type { Song } from './models/Song';
import { usePlaylist } from './hooks/usePlaylist';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { getDefaultSongs } from './services/itunesApi';
import { Vinyl } from './components/Vinyl/Vinyl';
import { Playlist } from './components/Playlist/Playlist';
import { SearchBar } from './components/SearchBar/SearchBar';
import './App.css';

export default function App() {
  const playlist = usePlaylist();
  const [bgColor, setBgColor] = useState('#e8d5ff');
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSongEnded = useCallback(() => {
    const next = playlist.playNext();
    if (next?.song.previewUrl) {
      player.play(next.song.previewUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const player = useAudioPlayer(handleSongEnded);

  useEffect(() => {
    getDefaultSongs()
      .then((songs) => {
        songs.forEach((song) => playlist.addToEnd(song));
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePlaySong(id: string) {
    playlist.playSong(id);
    const node = playlist.songs.find((n) => n.song.id === id);
    if (node?.song.previewUrl) {
      player.play(node.song.previewUrl);
    }
  }

  function handlePlayNow(song: Song) {
    playlist.addToEnd(song);
    playlist.playSong(song.id);
    if (song.previewUrl) {
      player.play(song.previewUrl);
    }
  }

  function handleAddAtPosition(song: Song, position: number) {
    playlist.addAtPosition(song, position);
  }

  function handleNext() {
    const next = playlist.playNext();
    if (next?.song.previewUrl) {
      player.play(next.song.previewUrl);
    }
  }

  function handlePrev() {
    const prev = playlist.playPrev();
    if (prev?.song.previewUrl) {
      player.play(prev.song.previewUrl);
    }
  }

  const filteredSongs = playlist.getFilteredSongs();

  return (
    <div
      className="app"
      style={{
        '--dynamic-color': bgColor,
        '--dynamic-color-light': bgColor + '55',
      } as React.CSSProperties}
    >
      {/* Paper + ambient light */}
      <div className="app__bg">
        <div className="app__blob app__blob--1" />
        <div className="app__blob app__blob--2" />
        <div className="app__blob app__blob--3" />
      </div>

      <main className="console" aria-label="Vintage Vinyl Player">
        <section className="console__frame">
          <header className="console__top">
            <div className="console__brand" aria-label="Brand">
              <div className="console__mark" aria-hidden="true" />
              <div className="console__wordmark">
                <div className="console__title">Vinyl Atelier</div>
                <div className="console__subtitle">Turntable player</div>
              </div>
            </div>

            <div className="console__topRight">
              <div className="console__statusPill" aria-label="Queue size">
                {playlist.songs.length} in queue
              </div>
            </div>
          </header>

          <div className="console__body">
            <div className="console__hero">
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
            </div>

            <div className="console__dock" aria-label="Actions">
              <button
                className={`dockBtn ${isSearchOpen ? 'dockBtn--active' : ''}`}
                onClick={() => {
                  setIsSearchOpen((v) => !v);
                  setIsPlaylistOpen(false);
                }}
                aria-expanded={isSearchOpen}
              >
                Browse & add
              </button>
              <button
                className={`dockBtn ${isPlaylistOpen ? 'dockBtn--active' : ''}`}
                onClick={() => {
                  setIsPlaylistOpen((v) => !v);
                  setIsSearchOpen(false);
                }}
                aria-expanded={isPlaylistOpen}
              >
                Playlist
                <span className="dockBtn__count">{playlist.songs.length}</span>
              </button>
            </div>

            <div
              className={`console__modalOverlay ${
                isSearchOpen || isPlaylistOpen ? 'console__modalOverlay--open' : ''
              }`}
              onMouseDown={() => {
                setIsSearchOpen(false);
                setIsPlaylistOpen(false);
              }}
              aria-hidden={!(isSearchOpen || isPlaylistOpen)}
            >
              <div
                className="console__modal"
                role="dialog"
                aria-label={isSearchOpen ? 'Search songs' : 'Playlist'}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="console__modalTop">
                  <div className="console__modalTitle">
                    {isSearchOpen ? 'Browse & add records' : 'Playlist'}
                  </div>
                  <button
                    className="console__modalClose"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setIsPlaylistOpen(false);
                    }}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="console__modalBody">
                  {isSearchOpen ? (
                    <SearchBar
                      query={playlist.searchQuery}
                      onQueryChange={playlist.setSearchQuery}
                      onAddSong={playlist.addToEnd}
                      onAddAtPosition={handleAddAtPosition}
                      onPlayNow={handlePlayNow}
                      queueSize={playlist.songs.length}
                      onAddToStart={playlist.addToStart}
                    />
                  ) : (
                    <Playlist
                      songs={filteredSongs}
                      currentSong={playlist.currentSong}
                      showFavoritesOnly={playlist.showFavoritesOnly}
                      onPlay={handlePlaySong}
                      onRemove={playlist.removeSong}
                      onToggleFavorite={playlist.toggleFavorite}
                      onToggleFavoritesFilter={playlist.toggleFavoritesFilter}
                      onReorder={playlist.reorderSong}
                      onClose={() => setIsPlaylistOpen(false)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
