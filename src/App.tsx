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
              <div className="console__mark" aria-hidden="true">
                ♫
              </div>
              <div className="console__wordmark">
                <div className="console__title">Vinyl Atelier</div>
                <div className="console__subtitle">A warm, modern turntable UI</div>
              </div>
            </div>

            <div className="console__topRight">
              <button
                className={`console__queueBtn ${isPlaylistOpen ? 'console__queueBtn--open' : ''}`}
                onClick={() => setIsPlaylistOpen((v) => !v)}
                aria-label={isPlaylistOpen ? 'Hide playlist' : 'Show playlist'}
                aria-expanded={isPlaylistOpen}
              >
                <span className="console__queueIcon" aria-hidden="true">
                  ⟡
                </span>
                <span className="console__queueText">Queue</span>
                <span className="console__queueCount" aria-label="Queue size">
                  {playlist.songs.length}
                </span>
              </button>
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

            <aside className="console__side">
              <div className="console__crate">
                <div className="console__crateTitle">Crate dig</div>
                <div className="console__crateHint">Search & place records in your queue.</div>
                <SearchBar
                  query={playlist.searchQuery}
                  onQueryChange={playlist.setSearchQuery}
                  onAddSong={playlist.addToEnd}
                  onAddAtPosition={handleAddAtPosition}
                  onPlayNow={handlePlayNow}
                  queueSize={playlist.songs.length}
                  onAddToStart={playlist.addToStart}
                />
              </div>

              <div
                className={`console__playlistFlyout ${isPlaylistOpen ? 'console__playlistFlyout--open' : ''}`}
                role="dialog"
                aria-label="Playlist"
              >
                <div className="console__playlistFlyoutInner">
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
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
