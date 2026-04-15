import { useState, useEffect, useCallback, useRef } from 'react';
import { getValidAccessToken } from '../services/spotifyAuth';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: SpotifyPlayerOptions) => SpotifyPlayer;
    };
  }
}

interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume: number;
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, cb: (data: unknown) => void) => void;
  removeListener: (event: string) => void;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  seek: (position: number) => Promise<void>;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
}

interface SpotifyPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      id: string;
      uri: string;
      name: string;
    };
  };
}

interface PlayerState {
  isReady: boolean;
  isPlaying: boolean;
  deviceId: string | null;
  position: number;
  duration: number;
  volume: number;
}

interface PlayerActions {
  play: (uri: string) => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
}

export function useSpotifyPlayer(): PlayerState & PlayerActions {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const [state, setState] = useState<PlayerState>({
    isReady: false,
    isPlaying: false,
    deviceId: null,
    position: 0,
    duration: 0,
    volume: 0.7,
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Music Player',
        getOAuthToken: async (cb) => {
          const token = await getValidAccessToken();
          if (token) cb(token);
        },
        volume: 0.7,
      });

      player.addListener('ready', (data) => {
        const { device_id } = data as { device_id: string };
        setState((prev) => ({ ...prev, isReady: true, deviceId: device_id }));
      });

      player.addListener('not_ready', () => {
        setState((prev) => ({ ...prev, isReady: false, deviceId: null }));
      });

      player.addListener('player_state_changed', (data) => {
        const s = data as SpotifyPlaybackState | null;
        if (!s) return;
        setState((prev) => ({
          ...prev,
          isPlaying: !s.paused,
          position: s.position,
          duration: s.duration,
        }));
      });

      player.connect();
      playerRef.current = player;
    };

    return () => {
      playerRef.current?.disconnect();
      document.body.removeChild(script);
    };
  }, []);

  const play = useCallback(async (uri: string) => {
    const token = await getValidAccessToken();
    const deviceId = playerRef.current
      ? await playerRef.current
          .getCurrentState()
          .then(() => null)
          .catch(() => null)
      : null;

    const id = state.deviceId ?? deviceId;
    if (!token || !id) return;

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [uri] }),
    });
  }, [state.deviceId]);

  const togglePlay = useCallback(async () => {
    await playerRef.current?.togglePlay();
  }, []);

  const seek = useCallback(async (position: number) => {
    await playerRef.current?.seek(position);
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    await playerRef.current?.setVolume(volume);
    setState((prev) => ({ ...prev, volume }));
  }, []);

  return { ...state, play, togglePlay, seek, setVolume };
}
