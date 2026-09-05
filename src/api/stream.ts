const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

/** URL absoluta del endpoint propio que resuelve y sirve el audio de un video. */
export function getStreamUrl(videoId: string): string {
  return `${API_BASE}/api/stream/${videoId}`;
}
