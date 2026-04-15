import { useState } from 'react';
import type { Song } from '../../models/Song';
import { searchTracks } from '../../services/itunesApi';
import './SearchBar.css';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onAddSong: (song: Song) => void;
}

export function SearchBar({ query, onQueryChange, onAddSong }: SearchBarProps) {
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(value: string) {
    onQueryChange(value);
    if (!value.trim() || value.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const tracks = await searchTracks(value);
      setResults(tracks);
    } catch {
      setError('Search failed. Make sure you are logged in.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handleAdd(song: Song) {
    onAddSong(song);
    setResults([]);
    onQueryChange('');
  }

  return (
    <div className="search-bar">
      <div className="search-bar__input-wrapper">
        <span className="search-bar__icon" aria-hidden="true">🔍</span>
        <input
          className="search-bar__input"
          type="search"
          placeholder="Search songs, artists..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Search songs"
        />
        {isSearching && <span className="search-bar__spinner" aria-hidden="true" />}
      </div>

      {error && <p className="search-bar__error">{error}</p>}

      {results.length > 0 && (
        <ul className="search-bar__results" role="listbox" aria-label="Search results">
          {results.map((song) => (
            <li key={song.id} className="search-bar__result" role="option">
              <img
                className="search-bar__result-art"
                src={song.albumArt}
                alt={song.album}
              />
              <div className="search-bar__result-info">
                <span className="search-bar__result-title">{song.title}</span>
                <span className="search-bar__result-artist">{song.artist}</span>
              </div>
              <button
                className="search-bar__add-btn"
                onClick={() => handleAdd(song)}
                aria-label={`Add ${song.title} to queue`}
              >
                +
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
