import { useEffect, useCallback } from 'react';
import { usePlaylist } from './hooks/usePlaylist';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { getDefaultSongs } from './services/itunesApi';
import { Player } from './components/Player/Player';
import { Playlist } from './components/Playlist/Playlist';
import { SearchBar } from './components/SearchBar/SearchBar';
import './App.css';

export default function App() {
  const playlist = usePlaylist();

  const handleSongEnded = useCallback(() => {
    const next = playlist.playNext();
    if (next?.song.previewUrl) {
      player.play(next.song.previewUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const player = useAudioPlayer(handleSongEnded);

  // Load default songs on mount
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
    <div className="app">
      <header className="app__header">
        <h1 className="app__logo">♫ Music Player</h1>
        <SearchBar
          query={playlist.searchQuery}
          onQueryChange={playlist.setSearchQuery}
          onAddSong={playlist.addToEnd}
        />
      </header>

      <main className="app__main">
        <Playlist
          songs={filteredSongs}
          currentSong={playlist.currentSong}
          showFavoritesOnly={playlist.showFavoritesOnly}
          onPlay={handlePlaySong}
          onRemove={playlist.removeSong}
          onToggleFavorite={playlist.toggleFavorite}
          onToggleFavoritesFilter={playlist.toggleFavoritesFilter}
        />
      </main>

      <Player
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
      />
    </div>
  );
}
