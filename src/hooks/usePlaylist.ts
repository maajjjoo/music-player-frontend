import { useState, useCallback, useRef } from 'react';
import { DoublyLinkedList } from '../data-structures/DoublyLinkedList';
import { Song, SongNode } from '../models/Song';

export type RepeatMode = 'none' | 'one' | 'all';

interface PlaylistState {
  songs: SongNode[];
  currentSong: SongNode | null;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  searchQuery: string;
  showFavoritesOnly: boolean;
}

interface PlaylistActions {
  addToEnd: (song: Song) => void;
  addToStart: (song: Song) => void;
  addAtPosition: (song: Song, position: number) => void;
  removeSong: (id: string) => void;
  playNext: () => SongNode | null;
  playPrev: () => SongNode | null;
  playSong: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setSearchQuery: (query: string) => void;
  toggleFavoritesFilter: () => void;
  getFilteredSongs: () => SongNode[];
}

export function usePlaylist(): PlaylistState & PlaylistActions {
  const dll = useRef(new DoublyLinkedList());

  const [state, setState] = useState<PlaylistState>({
    songs: [],
    currentSong: null,
    isShuffled: false,
    repeatMode: 'none',
    searchQuery: '',
    showFavoritesOnly: false,
  });

  const sync = useCallback(() => {
    setState((prev) => ({
      ...prev,
      songs: dll.current.toArray(),
      currentSong: dll.current.getCurrentNode(),
    }));
  }, []);

  const addToEnd = useCallback(
    (song: Song) => {
      dll.current.addToEnd(song);
      sync();
    },
    [sync]
  );

  const addToStart = useCallback(
    (song: Song) => {
      dll.current.addToStart(song);
      sync();
    },
    [sync]
  );

  const addAtPosition = useCallback(
    (song: Song, position: number) => {
      dll.current.addAtPosition(song, position);
      sync();
    },
    [sync]
  );

  const removeSong = useCallback(
    (id: string) => {
      dll.current.remove(id);
      sync();
    },
    [sync]
  );

  const playNext = useCallback((): SongNode | null => {
    const next = dll.current.wrapNext();
    sync();
    return next;
  }, [sync]);

  const playPrev = useCallback((): SongNode | null => {
    const prev = dll.current.wrapPrev();
    sync();
    return prev;
  }, [sync]);

  const playSong = useCallback(
    (id: string) => {
      const nodes = dll.current.toArray();
      const node = nodes.find((n) => n.song.id === id) ?? null;
      dll.current.setCurrentNode(node);
      sync();
    },
    [sync]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      dll.current.toggleFavorite(id);
      sync();
    },
    [sync]
  );

  const toggleShuffle = useCallback(() => {
    dll.current.shuffle();
    setState((prev) => ({ ...prev, isShuffled: !prev.isShuffled }));
    sync();
  }, [sync]);

  const toggleRepeat = useCallback(() => {
    setState((prev) => {
      const modes: RepeatMode[] = ['none', 'all', 'one'];
      const next = modes[(modes.indexOf(prev.repeatMode) + 1) % modes.length];
      return { ...prev, repeatMode: next };
    });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const toggleFavoritesFilter = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showFavoritesOnly: !prev.showFavoritesOnly,
    }));
  }, []);

  const getFilteredSongs = useCallback((): SongNode[] => {
    let nodes = state.searchQuery
      ? dll.current.search(state.searchQuery)
      : dll.current.toArray();

    if (state.showFavoritesOnly) {
      nodes = nodes.filter((n) => n.song.isFavorite);
    }

    return nodes;
  }, [state.searchQuery, state.showFavoritesOnly]);

  return {
    ...state,
    addToEnd,
    addToStart,
    addAtPosition,
    removeSong,
    playNext,
    playPrev,
    playSong,
    toggleFavorite,
    toggleShuffle,
    toggleRepeat,
    setSearchQuery,
    toggleFavoritesFilter,
    getFilteredSongs,
  };
}
