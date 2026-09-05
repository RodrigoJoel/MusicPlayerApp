import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { RepeatMode, Track } from '../types/track';
import { getSimilarTracks } from '../api/youtube';
import { getStreamUrl } from '../api/stream';

interface PlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  isReady: boolean;
  progress: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  isLoadingSimilar: boolean;
  playbackError: string | null;
  playTrack: (track: Track, queueContext?: Track[]) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (tracks: Track[]) => void;
  removeFromQueue: (videoId: string) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (value: number) => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  playSimilar: (track: Track) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

// El audio real vive en un elemento <audio> nativo (no en un iframe de
// YouTube), para que iOS pueda seguir reproduciéndolo en segundo plano.
// Es un singleton a nivel de módulo (como antes lo era `apiLoadPromise`):
// no es estado de React, es un objeto externo mutable de larga vida.
const audio = new Audio();

/**
 * Genera un orden aleatorio de índices de `length` elementos. Si `anchorIdx`
 * es válido, queda fijo en la primera posición (la canción actual no salta
 * al activar el modo aleatorio).
 */
function buildShuffleOrder(length: number, anchorIdx: number): number[] {
  const rest = Array.from({ length }, (_, i) => i).filter((i) => i !== anchorIdx);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return anchorIdx >= 0 && anchorIdx < length ? [anchorIdx, ...rest] : rest;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const queueRef = useRef<Track[]>([]);
  const indexRef = useRef(-1);
  const repeatRef = useRef<RepeatMode>('off');
  const volumeRef = useRef(80);
  const isShuffledRef = useRef(false);
  const shuffleOrderRef = useRef<number[]>([]);
  const shufflePosRef = useRef(0);

  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffled, setIsShuffled] = useState(false);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    repeatRef.current = repeatMode;
  }, [repeatMode]);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);
  useEffect(() => {
    isShuffledRef.current = isShuffled;
  }, [isShuffled]);

  // Si la cola cambia (se agregan/quitan canciones) mientras el modo
  // aleatorio está activo, regenera el orden para que siga siendo válido.
  useEffect(() => {
    if (!isShuffled) return;
    shuffleOrderRef.current = buildShuffleOrder(queue.length, indexRef.current);
    shufflePosRef.current = 0;
  }, [queue, isShuffled]);

  const loadIndex = useCallback(
    (idx: number, tracks: Track[]) => {
      if (idx < 0 || idx >= tracks.length) return;
      setCurrentIndex(idx);
      setProgress(0);
      setDuration(0);
      setPlaybackError(null);
      const track = tracks[idx];
      audio.src = getStreamUrl(track.videoId);
      audio.volume = volumeRef.current / 100;
      audio.play().catch(() => {});
    },
    [],
  );

  const playByIndex = useCallback(
    (idx: number, tracks: Track[]) => {
      if (idx < 0 || idx >= tracks.length) return;
      if (isShuffledRef.current) {
        shuffleOrderRef.current = buildShuffleOrder(tracks.length, idx);
        shufflePosRef.current = 0;
      }
      loadIndex(idx, tracks);
    },
    [loadIndex],
  );

  const next = useCallback(() => {
    const tracks = queueRef.current;
    if (tracks.length === 0) return;

    if (isShuffledRef.current) {
      let nextPos = shufflePosRef.current + 1;
      if (nextPos >= shuffleOrderRef.current.length) {
        if (repeatRef.current !== 'all') return;
        shuffleOrderRef.current = buildShuffleOrder(tracks.length, -1);
        nextPos = 0;
      }
      shufflePosRef.current = nextPos;
      loadIndex(shuffleOrderRef.current[nextPos], tracks);
      return;
    }

    let nextIdx = indexRef.current + 1;
    if (nextIdx >= tracks.length) {
      if (repeatRef.current === 'all') nextIdx = 0;
      else return;
    }
    loadIndex(nextIdx, tracks);
  }, [loadIndex]);

  const previous = useCallback(() => {
    const tracks = queueRef.current;
    if (tracks.length === 0) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setProgress(0);
      return;
    }

    if (isShuffledRef.current) {
      const order = shuffleOrderRef.current;
      if (order.length === 0) return;
      let prevPos = shufflePosRef.current - 1;
      if (prevPos < 0) {
        prevPos = repeatRef.current === 'all' ? order.length - 1 : 0;
      }
      shufflePosRef.current = prevPos;
      loadIndex(order[prevPos], tracks);
      return;
    }

    let prevIdx = indexRef.current - 1;
    if (prevIdx < 0) {
      prevIdx = repeatRef.current === 'all' ? tracks.length - 1 : 0;
    }
    loadIndex(prevIdx, tracks);
  }, [loadIndex]);

  // Eventos nativos del elemento <audio>: reemplazan el polling y los
  // callbacks que antes daba la YouTube IFrame Player API.
  useEffect(() => {
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleEnded = () => {
      if (repeatRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        next();
      }
    };
    const handleError = () => {
      const track = queueRef.current[indexRef.current];
      setPlaybackError(
        track
          ? `No se pudo reproducir "${track.title}"`
          : 'No se pudo reproducir la canción',
      );
      next();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [next]);

  const playQueue = useCallback(
    (tracks: Track[], startIndex = 0) => {
      setQueue(tracks);
      queueRef.current = tracks;
      playByIndex(startIndex, tracks);
    },
    [playByIndex],
  );

  const playTrack = useCallback(
    (track: Track, queueContext?: Track[]) => {
      const tracks =
        queueContext && queueContext.length > 0 ? queueContext : [track];
      const idx = tracks.findIndex((t) => t.videoId === track.videoId);
      playQueue(tracks, idx >= 0 ? idx : 0);
    },
    [playQueue],
  );

  const addToQueue = useCallback((tracks: Track[]) => {
    setQueue((prev) => {
      const merged = [
        ...prev,
        ...tracks.filter((t) => !prev.some((p) => p.videoId === t.videoId)),
      ];
      queueRef.current = merged;
      return merged;
    });
  }, []);

  const removeFromQueue = useCallback((videoId: string) => {
    setQueue((prev) => {
      const removedIdx = prev.findIndex((t) => t.videoId === videoId);
      if (removedIdx === -1) return prev;
      const next = prev.filter((t) => t.videoId !== videoId);
      queueRef.current = next;
      if (removedIdx < indexRef.current) {
        setCurrentIndex((i) => i - 1);
      }
      return next;
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) audio.pause();
    else audio.play().catch(() => {});
  }, [isPlaying]);

  const seekTo = useCallback((seconds: number) => {
    audio.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    volumeRef.current = value;
    audio.volume = value / 100;
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) =>
      prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off',
    );
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const next = !prev;
      if (next) {
        shuffleOrderRef.current = buildShuffleOrder(
          queueRef.current.length,
          indexRef.current,
        );
        shufflePosRef.current = 0;
      }
      return next;
    });
  }, []);

  const playSimilar = useCallback(
    async (track: Track) => {
      setIsLoadingSimilar(true);
      try {
        const similar = await getSimilarTracks(track);
        addToQueue(similar);
      } finally {
        setIsLoadingSimilar(false);
      }
    },
    [addToQueue],
  );

  const currentTrack = currentIndex >= 0 ? (queue[currentIndex] ?? null) : null;
  // Ya no depende de cargar una API externa (como pasaba con el IFrame de
  // YouTube): el elemento <audio> nativo está listo desde el primer render.
  const isReady = true;

  // Controles del sistema (pantalla de bloqueo, auriculares, auto) vía Media Session API.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => {
      audio.play().catch(() => {});
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audio.pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime == null) return;
      audio.currentTime = details.seekTime;
      setProgress(details.seekTime);
    });
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    };
  }, [next, previous]);

  // Metadata (título, artista, portada) que muestra el sistema en la pantalla de bloqueo.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = currentTrack
      ? new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.channelTitle,
          artwork: [
            { src: currentTrack.thumbnail, sizes: '480x360', type: 'image/jpeg' },
          ],
        })
      : null;
  }, [currentTrack]);

  // Estado de reproducción (afecta el ícono play/pause que muestra el sistema).
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Posición actual, para la barra de progreso de la pantalla de bloqueo.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState)
      return;
    if (!duration || !Number.isFinite(duration) || duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(progress, duration),
      });
    } catch {
      // Vite/algunos navegadores pueden tirar un error transitorio con valores
      // desincronizados justo al cambiar de canción; no es crítico, se ignora.
    }
  }, [progress, duration]);

  const value: PlayerContextValue = {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    isReady,
    progress,
    duration,
    volume,
    repeatMode,
    isShuffled,
    isLoadingSimilar,
    playbackError,
    playTrack,
    playQueue,
    addToQueue,
    removeFromQueue,
    togglePlay,
    next,
    previous,
    seekTo,
    setVolume,
    cycleRepeat,
    toggleShuffle,
    playSimilar,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer debe usarse dentro de <PlayerProvider>');
  return ctx;
}
