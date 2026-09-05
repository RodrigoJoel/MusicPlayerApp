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

// Distintos "clientes" de YouTube exponen/bloquean cosas distintas para el
// mismo video (ver comentarios en cada uso). Se prueban en orden y se usa
// el primero que resuelva.
const PLAYER_CLIENTS = ['android', 'web'];

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
    const url = await Promise.race([resolveWithFallback(videoUrl, videoId), timeout]);
    console.log(`[resolver] ${videoId} resuelto en ${Date.now() - startedAt}ms`);
    return url;
  } catch (err) {
    console.error(`[resolver] falló ${videoId} tras ${Date.now() - startedAt}ms:`, err);
    throw err;
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Prueba cada cliente de YouTube en orden hasta que uno resuelva. Algunos
 * bloqueos (anti-bot, restricciones de derechos) aplican a un cliente pero
 * no a otro para el mismo video, así que reintentar con otro cliente
 * recupera casos que de otra forma fallarían del todo.
 */
async function resolveWithFallback(videoUrl: string, videoId: string): Promise<string> {
  let lastError: StreamResolutionError | null = null;

  for (const playerClient of PLAYER_CLIENTS) {
    try {
      const result = await youtubedl(videoUrl, {
        getUrl: true,
        // Safari/iOS no decodifica Opus/WebM (el formato que "bestaudio" a
        // secas suele elegir); se fuerza AAC/M4A, que sí soporta, con
        // fallback a mp4 muxeado (también AAC) y por último a lo que haya.
        format: 'bestaudio[ext=m4a]/best[ext=mp4]/bestaudio/best',
        noWarnings: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        extractorArgs: `youtube:player_client=${playerClient}`,
      } as Parameters<typeof youtubedl>[1]);

      const url = String(result).trim().split('\n')[0];
      if (!url) throw new StreamResolutionError('unknown', 500, 'yt-dlp no devolvió una URL');
      return url;
    } catch (err) {
      lastError =
        err instanceof StreamResolutionError
          ? err
          : classifyYtDlpError((err as { stderr?: string })?.stderr ?? String(err));
      console.warn(`[resolver] ${videoId} falló con cliente "${playerClient}": ${lastError.code}`);
    }
  }

  throw lastError!;
}
