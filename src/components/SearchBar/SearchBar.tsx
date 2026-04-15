import { useState } from 'react';
import type { Song } from '../../models/Song';
import { searchTracks } from '../../services/itunesApi';
import './SearchBar.css';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onAddSong: (song: Song) => void;
  onAddToStart: (song: Song) => void;
  onAddAtPosition: (song: Song, position: number) => void;
  onPlayNow: (song: Song) => void;
  queueSize: number;
}

export function SearchBar({
  query,
  onQueryChange,
  onAddSong,
  onAddToStart,
  onAddAtPosition,
  onPlayNow,
  queueSize,
}: SearchBarProps) {
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positionInputId, setPositionInputId] = useState<string | null>(null);
  const [positionValue, setPositionValue] = useState('');

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
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handlePlayNow(song: Song) {
    onPlayNow(song);
    setResults([]);
    onQueryChange('');
  }

  function handleAddToEnd(song: Song) {
    onAddSong(song);
    setResults([]);
    onQueryChange('');
  }

  function handleAddToStart(song: Song) {
    onAddToStart(song);
    setResults([]);
    onQueryChange('');
  }

  function handleAddAtPosition(song: Song) {
    const pos = parseInt(positionValue);
    if (!isNaN(pos) && pos >= 0) {
      onAddAtPosition(song, pos);
    } else {
      onAddSong(song);
    }
    setPositionInputId(null);
    setPositionValue('');
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

              {positionInputId === song.id ? (
                <div className="search-bar__position">
                  <input
                    className="search-bar__position-input"
                    type="number"
                    min={0}
                    max={queueSize}
                    placeholder={`0–${queueSize}`}
                    value={positionValue}
                    onChange={(e) => setPositionValue(e.target.value)}
                    autoFocus
                    aria-label="Position in queue"
                  />
                  <button
                    className="search-bar__add-btn"
                    onClick={() => handleAddAtPosition(song)}
                    aria-label="Confirm position"
                  >
                    ✓
                  </button>
                  <button
                    className="search-bar__cancel-btn"
                    onClick={() => { setPositionInputId(null); setPositionValue(''); }}
                    aria-label="Cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="search-bar__actions">
                  <button
                    className="search-bar__play-btn"
                    onClick={() => handlePlayNow(song)}
                    aria-label={`Play ${song.title} now`}
                    title="Play now"
                  >
                    ▶
                  </button>
                  <button
                    className="search-bar__start-btn"
                    onClick={() => handleAddToStart(song)}
                    aria-label={`Add ${song.title} to start of queue`}
                    title="Add to start"
                  >
                    ⇤
                  </button>
                  <button
                    className="search-bar__add-btn"
                    onClick={() => handleAddToEnd(song)}
                    aria-label={`Add ${song.title} to end of queue`}
                    title="Add to end"
                  >
                    +
                  </button>
                  <button
                    className="search-bar__position-btn"
                    onClick={() => { setPositionInputId(song.id); setPositionValue(''); }}
                    aria-label={`Add ${song.title} at position`}
                    title="Add at position"
                  >
                    #
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
