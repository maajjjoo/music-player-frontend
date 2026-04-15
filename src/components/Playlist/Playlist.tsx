import { SongNode } from '../../models/Song';
import { SongItem } from './SongItem';
import './Playlist.css';

interface PlaylistProps {
  songs: SongNode[];
  currentSong: SongNode | null;
  showFavoritesOnly: boolean;
  onPlay: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleFavoritesFilter: () => void;
}

export function Playlist({
  songs,
  currentSong,
  showFavoritesOnly,
  onPlay,
  onRemove,
  onToggleFavorite,
  onToggleFavoritesFilter,
}: PlaylistProps) {
  return (
    <section className="playlist">
      <div className="playlist__header">
        <h2 className="playlist__title">Queue</h2>
        <button
          className={`playlist__filter-btn ${showFavoritesOnly ? 'playlist__filter-btn--active' : ''}`}
          onClick={onToggleFavoritesFilter}
          aria-pressed={showFavoritesOnly}
        >
          {showFavoritesOnly ? '♥ Favorites' : '♡ Favorites'}
        </button>
      </div>

      {songs.length === 0 ? (
        <div className="playlist__empty">
          <p>
            {showFavoritesOnly
              ? 'No favorite songs yet. Heart a song to add it here.'
              : 'Your queue is empty. Search for songs to add them.'}
          </p>
        </div>
      ) : (
        <ul className="playlist__list" role="list">
          {songs.map((node) => (
            <SongItem
              key={node.song.id}
              node={node}
              isActive={currentSong?.song.id === node.song.id}
              onPlay={onPlay}
              onRemove={onRemove}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
