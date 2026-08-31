import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { hasApiKey, searchTracks } from '../api/youtube';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../hooks/useLibrary';
import type { Track } from '../types/track';
import { SearchIcon } from './Icon';
import { TrackRow } from './TrackRow';

const INITIAL_QUERY = 'lofi hip hop';

export function SearchView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);

  const { playTrack, playSimilar, currentTrack, isPlaying, isLoadingSimilar } =
    usePlayer();
  const library = useLibrary();

  const runSearch = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const tracks = await searchTracks(q);
      setResults(tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar');
      setResults([]);
    } finally {
      setIsLoading(false);
      setHasSearchedOnce(true);
    }
  }, []);

  // Búsqueda inicial de ejemplo al entrar a la vista.
  useEffect(() => {
    runSearch(INITIAL_QUERY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    window.clearTimeout(debounceRef.current);
    if (!value.trim()) return;
    debounceRef.current = window.setTimeout(() => runSearch(value), 500);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    window.clearTimeout(debounceRef.current);
    runSearch(query || INITIAL_QUERY);
  }

  return (
    <section className="view">
      <form className="search-bar" onSubmit={handleSubmit}>
        <SearchIcon size={18} className="search-bar__icon" />
        <input
          type="search"
          inputMode="search"
          placeholder="Buscar canciones, artistas..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
        />
      </form>

      {!hasApiKey && (
        <div className="banner banner--demo">
          <strong>Modo demo:</strong> no configuraste una{' '}
          <code>VITE_YOUTUBE_API_KEY</code>. Se muestran resultados de
          ejemplo. Mirá el README para conseguir una key gratis de YouTube
          Data API v3.
        </div>
      )}

      {isLoadingSimilar && (
        <div className="banner banner--info">Buscando canciones similares…</div>
      )}

      {error && <div className="banner banner--error">{error}</div>}

      {isLoading ? (
        <div className="loading-state">Buscando…</div>
      ) : results.length === 0 && hasSearchedOnce ? (
        <div className="empty-state">
          No encontramos resultados para "{query}".
        </div>
      ) : (
        <div className="track-list">
          {results.map((track) => (
            <TrackRow
              key={track.videoId}
              track={track}
              isSaved={library.isSaved(track.videoId)}
              isActive={currentTrack?.videoId === track.videoId}
              isPlayingActive={
                currentTrack?.videoId === track.videoId && isPlaying
              }
              onPlay={() => playTrack(track, results)}
              onToggleSave={() => library.toggle(track)}
              onSimilar={() => playSimilar(track)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
