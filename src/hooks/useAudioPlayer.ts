import { useState, useEffect, useRef, useCallback } from 'react';

interface AudioPlayerState {
  isPlaying: boolean;
  position: number;  // in milliseconds
  duration: number;  // in milliseconds
  volume: number;
}

interface AudioPlayerActions {
  play: (url: string) => void;
  togglePlay: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
}

export function useAudioPlayer(
  onEnded?: () => void
): AudioPlayerState & AudioPlayerActions {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: 0.7,
  });

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = 0.7;

    const onTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        position: audio.currentTime * 1000,
      }));
    };

    const onDurationChange = () => {
      setState((prev) => ({
        ...prev,
        duration: audio.duration * 1000,
      }));
    };

    const onPlay = () => setState((prev) => ({ ...prev, isPlaying: true }));
    const onPause = () => setState((prev) => ({ ...prev, isPlaying: false }));
    const onEndedHandler = () => {
      setState((prev) => ({ ...prev, isPlaying: false, position: 0 }));
      onEnded?.();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEndedHandler);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEndedHandler);
      audio.pause();
    };
  }, [onEnded]);

  const play = useCallback((url: string) => {
    const audio = audioRef.current;
    if (audio.src !== url) {
      audio.src = url;
      audio.load();
    }
    audio.play().catch(console.error);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((position: number) => {
    audioRef.current.currentTime = position / 1000;
  }, []);

  const setVolume = useCallback((volume: number) => {
    audioRef.current.volume = volume;
    setState((prev) => ({ ...prev, volume }));
  }, []);

  return { ...state, play, togglePlay, seek, setVolume };
}
