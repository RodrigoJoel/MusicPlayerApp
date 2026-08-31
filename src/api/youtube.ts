import type { Track } from '../types/track';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

/** true si el usuario configuró una API key real en .env */
export const hasApiKey = Boolean(API_KEY && API_KEY.trim().length > 0);

/**
 * Datos de ejemplo para poder ver/probar la UI sin necesidad de una API key.
 * Los videoId son reales (canciones populares con lyric video oficial) para
 * que, si el usuario quiere, la reproducción funcione también en modo demo.
 */
const MOCK_TRACKS: Track[] = [
  {
    videoId: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    channelTitle: 'Rick Astley',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  },
  {
    videoId: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    channelTitle: 'Queen Official',
    thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
  },
  {
    videoId: 'JGwWNGJdvx8',
    title: 'Shape of You',
    channelTitle: 'Ed Sheeran',
    thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
  },
  {
    videoId: 'kJQP7kiw5Fk',
    title: 'Despacito',
    channelTitle: 'Luis Fonsi',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
  },
  {
    videoId: '09R8_2nJtjg',
    title: 'Sugar',
    channelTitle: 'Maroon 5',
    thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg',
  },
  {
    videoId: 'YQHsXMglC9A',
    title: 'Hello',
    channelTitle: 'Adele',
    thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg',
  },
];

function mockSearch(query: string): Track[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_TRACKS;
  const filtered = MOCK_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.channelTitle.toLowerCase().includes(q),
  );
  // si no matchea nada, igual devolvemos algo para que la demo se vea viva
  return filtered.length > 0 ? filtered : MOCK_TRACKS;
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  error?: { message: string };
}

function mapItem(item: YouTubeSearchItem): Track {
  const thumb =
    item.snippet.thumbnails.high?.url ??
    item.snippet.thumbnails.medium?.url ??
    item.snippet.thumbnails.default?.url ??
    '';
  return {
    videoId: item.id.videoId,
    title: decodeHtml(item.snippet.title),
    channelTitle: decodeHtml(item.snippet.channelTitle),
    thumbnail: thumb,
    publishedAt: item.snippet.publishedAt,
  };
}

/** YouTube devuelve entidades HTML en los títulos (&amp;, &#39;, etc.) */
function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function rawSearch(query: string, maxResults = 15): Promise<Track[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoCategoryId', '10'); // categoría "Música"
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('q', query);
  url.searchParams.set('key', API_KEY as string);

  const res = await fetch(url.toString());
  const data: YouTubeSearchResponse = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message ?? `YouTube API error (${res.status})`);
  }

  return (data.items ?? [])
    .filter((item) => item.id?.videoId)
    .map(mapItem);
}

/** Busca canciones/videos por texto libre. */
export async function searchTracks(query: string): Promise<Track[]> {
  if (!hasApiKey) {
    // simulamos latencia de red para que la UI de loading se pueda probar
    await new Promise((r) => setTimeout(r, 300));
    return mockSearch(query);
  }
  return rawSearch(query);
}

/**
 * "Similares": la YouTube Data API v3 ya no soporta relatedToVideoId,
 * así que el approach del MVP es buscar más resultados del mismo canal
 * (mismo artista), excluyendo el video actual.
 */
export async function getSimilarTracks(track: Track): Promise<Track[]> {
  if (!hasApiKey) {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_TRACKS.filter((t) => t.videoId !== track.videoId);
  }
  const results = await rawSearch(track.channelTitle, 10);
  const filtered = results.filter((t) => t.videoId !== track.videoId);
  return filtered.length > 0 ? filtered : results;
}
