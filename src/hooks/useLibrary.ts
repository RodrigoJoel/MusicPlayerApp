import { useCallback, useEffect, useState } from 'react';
import type { LibraryTrack, Track } from '../types/track';

const STORAGE_KEY = 'musicplayerapp.library.v1';

function readStorage(): LibraryTrack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeStorage(tracks: LibraryTrack[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  } catch {
    // localStorage puede fallar en modo privado/cuota llena: falla en silencio
  }
}

/**
 * Maneja la biblioteca personal del usuario, persistida en localStorage.
 * Guarda: título, canal/artista, thumbnail y videoId de cada track.
 */
export function useLibrary() {
  const [library, setLibrary] = useState<LibraryTrack[]>(() => readStorage());

  useEffect(() => {
    writeStorage(library);
  }, [library]);

  const isSaved = useCallback(
    (videoId: string) => library.some((t) => t.videoId === videoId),
    [library],
  );

  const save = useCallback((track: Track) => {
    setLibrary((prev) => {
      if (prev.some((t) => t.videoId === track.videoId)) return prev;
      const entry: LibraryTrack = { ...track, savedAt: Date.now() };
      return [entry, ...prev];
    });
  }, []);

  const remove = useCallback((videoId: string) => {
    setLibrary((prev) => prev.filter((t) => t.videoId !== videoId));
  }, []);

  const toggle = useCallback(
    (track: Track) => {
      if (isSaved(track.videoId)) {
        remove(track.videoId);
      } else {
        save(track);
      }
    },
    [isSaved, save, remove],
  );

  return { library, isSaved, save, remove, toggle };
}
