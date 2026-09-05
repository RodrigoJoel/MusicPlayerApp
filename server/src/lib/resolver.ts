import youtubedl from 'yt-dlp-exec';
import { StreamResolutionError, classifyYtDlpError } from './errors.js';

interface CacheEntry {
  url: string;
  expiresAt: number;
}

const TTL_MS = Number(process.env.STREAM_CACHE_TTL_MS) || 4 * 60 * 60 * 1000;
const RESOLVE_TIMEOUT_MS = Number(process.env.RESOLVE_TIMEOUT_MS) || 45_000;

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<string>>();

/** Resuelve (con cache) la URL directa del stream de audio de un video de YouTube. */
export async function resolveStreamUrl(videoId: string): Promise<string> {
  const cached = cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const existing = inFlight.get(videoId);
  if (existing) return existing;

  const promise = resolveFresh(videoId)
    .then((url) => {
      cache.set(videoId, { url, expiresAt: Date.now() + TTL_MS });
      return url;
    })
    .finally(() => {
      inFlight.delete(videoId);
    });

  inFlight.set(videoId, promise);
  return promise;
}

async function resolveFresh(videoId: string): Promise<string> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const startedAt = Date.now();

  let timeoutId: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new StreamResolutionError('timeout', 504, 'yt-dlp tardó demasiado')),
      RESOLVE_TIMEOUT_MS,
    );
  });

  console.log(`[resolver] resolviendo ${videoId}...`);
  try {
    const result = await Promise.race([
      youtubedl(videoUrl, {
        getUrl: true,
        format: 'bestaudio',
        noWarnings: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
      }),
      timeout,
    ]);

    const url = String(result).trim().split('\n')[0];
    if (!url) {
      throw new StreamResolutionError('unknown', 500, 'yt-dlp no devolvió una URL');
    }
    console.log(`[resolver] ${videoId} resuelto en ${Date.now() - startedAt}ms`);
    return url;
  } catch (err) {
    console.error(`[resolver] falló ${videoId} tras ${Date.now() - startedAt}ms:`, err);
    if (err instanceof StreamResolutionError) throw err;
    const stderr = (err as { stderr?: string })?.stderr ?? String(err);
    throw classifyYtDlpError(stderr);
  } finally {
    clearTimeout(timeoutId!);
  }
}
