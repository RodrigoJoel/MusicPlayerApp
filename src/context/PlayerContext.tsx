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

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** id del <div> donde se monta el iframe real del reproductor de YouTube */
export const YT_PLAYER_ROOT_ID = 'yt-player-root';

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
  isLoadingSimilar: boolean;
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
  playSimilar: (track: Track) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

let apiLoadPromise: Promise<void> | null = null;

/** Carga el script externo de la YouTube IFrame Player API una sola vez. */
function loadYouTubeApi(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
  });

  return apiLoadPromise;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<YT.Player | null>(null);
  const queueRef = useRef<Track[]>([]);
  const indexRef = useRef(-1);
  const repeatRef = useRef<RepeatMode>('off');
  const volumeRef = useRef(80);

  const [isReady, setIsReady] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

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

  const playByIndex = useCallback((idx: number, tracks: Track[]) => {
    if (idx < 0 || idx >= tracks.length) return;
    setCurrentIndex(idx);
    setProgress(0);
    setDuration(0);
    const track = tracks[idx];
    if (playerRef.current) {
      playerRef.current.loadVideoById(track.videoId);
      playerRef.current.setVolume(volumeRef.current);
    }
  }, []);

  const next = useCallback(() => {
    const tracks = queueRef.current;
    if (tracks.length === 0) return;
    let nextIdx = indexRef.current + 1;
    if (nextIdx >= tracks.length) {
      if (repeatRef.current === 'all') nextIdx = 0;
      else return;
    }
    playByIndex(nextIdx, tracks);
  }, [playByIndex]);

  const previous = useCallback(() => {
    const tracks = queueRef.current;
    if (tracks.length === 0) return;
    const current = playerRef.current?.getCurrentTime?.() ?? 0;
    if (current > 3) {
      playerRef.current?.seekTo(0, true);
      setProgress(0);
      return;
    }
    let prevIdx = indexRef.current - 1;
    if (prevIdx < 0) {
      prevIdx = repeatRef.current === 'all' ? tracks.length - 1 : 0;
    }
    playByIndex(prevIdx, tracks);
  }, [playByIndex]);

  // Inicializa el player de YouTube una sola vez, montado en un <div> fijo.
  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled) return;
      playerRef.current = new YT.Player(YT_PLAYER_ROOT_ID, {
        height: '100%',
        width: '100%',
        playerVars: {
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(volumeRef.current);
            setIsReady(true);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setDuration(playerRef.current?.getDuration() ?? 0);
            } else if (event.data === YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === YT.PlayerState.ENDED) {
              if (repeatRef.current === 'one') {
                playerRef.current?.seekTo(0, true);
                playerRef.current?.playVideo();
              } else {
                next();
              }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling liviano del progreso mientras se reproduce.
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      setProgress(player.getCurrentTime());
      const d = player.getDuration();
      if (d && d !== duration) setDuration(d);
    }, 500);
    return () => window.clearInterval(id);
  }, [isPlaying, duration]);

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
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  }, [isPlaying]);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    setProgress(seconds);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    volumeRef.current = value;
    playerRef.current?.setVolume(value);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) =>
      prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off',
    );
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

  // Controles del sistema (pantalla de bloqueo, auriculares, auto) vía Media Session API.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => {
      playerRef.current?.playVideo();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      playerRef.current?.pauseVideo();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime == null) return;
      playerRef.current?.seekTo(details.seekTime, true);
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
    isLoadingSimilar,
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
