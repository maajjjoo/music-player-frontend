import { useEffect } from 'react';
import { usePlaylist } from './hooks/usePlaylist';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer';
import {
  isAuthenticated,
  redirectToSpotifyLogin,
  exchangeCodeForTokens,
  clearTokens,
} from './services/spotifyAuth';
import { getRecommendations } from './services/spotifyApi';
import { Player } from './components/Player/Player';
import { Playlist } from './components/Playlist/Playlist';
import { SearchBar } from './components/SearchBar/SearchBar';
import './App.css';

export default function App() {
  const playlist = usePlaylist();
  const player = useSpotifyPlayer();

  // Handle OAuth callback — works on any route (/callback?code=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      console.error('Spotify auth error:', error);
      window.history.replaceState({}, '', '/');
      return;
    }

    if (code) {
      exchangeCodeForTokens(code)
        .then(() => {
          window.history.replaceState({}, '', '/');
        })
        .catch((err) => {
          console.error('Token exchange failed:', err);
          window.history.replaceState({}, '', '/');
        });
    }
  }, []);

  // Load recommendations once authenticated and player is ready
  useEffect(() => {
    if (!isAuthenticated() || !player.isReady) return;

    getRecommendations()
      .then((songs) => {
        songs.forEach((song) => playlist.addToEnd(song));
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.isReady]);

  async function handlePlaySong(id: string) {
    playlist.playSong(id);
    const node = playlist.songs.find((n) => n.song.id === id);
    if (node) {
      await player.play(node.song.uri);
    }
  }

  async function handleNext() {
    const next = playlist.playNext();
    if (next) await player.play(next.song.uri);
  }

  async function handlePrev() {
    const prev = playlist.playPrev();
    if (prev) await player.play(prev.song.uri);
  }

  const filteredSongs = playlist.getFilteredSongs();

  if (!isAuthenticated()) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-card__logo">♫</div>
          <h1 className="login-card__title">Music Player</h1>
          <p className="login-card__subtitle">
            A doubly linked list powered music player
          </p>
          <button
            className="login-card__btn"
            onClick={() => redirectToSpotifyLogin()}
          >
            Connect with Spotify
          </button>
          <p className="login-card__note">
            Requires Spotify Premium for full playback
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__logo">♫ Music Player</h1>
        <SearchBar
          query={playlist.searchQuery}
          onQueryChange={playlist.setSearchQuery}
          onAddSong={playlist.addToEnd}
        />
        <button
          className="app__logout"
          onClick={() => {
            clearTokens();
            window.location.reload();
          }}
          aria-label="Log out"
        >
          Log out
        </button>
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
