export type StreamErrorCode =
  | 'invalid_id'
  | 'age_restricted'
  | 'unavailable'
  | 'timeout'
  | 'unknown';

export class StreamResolutionError extends Error {
  code: StreamErrorCode;
  status: number;

  constructor(code: StreamErrorCode, status: number, message: string) {
    super(message);
    this.name = 'StreamResolutionError';
    this.code = code;
    this.status = status;
  }
}

/** Traduce el stderr de yt-dlp a un error tipado con el código HTTP correspondiente. */
export function classifyYtDlpError(stderr: string): StreamResolutionError {
  const text = stderr.toLowerCase();

  if (text.includes('sign in to confirm your age') || text.includes('age-restricted')) {
    return new StreamResolutionError('age_restricted', 422, 'Video restringido por edad');
  }
  if (
    text.includes('video unavailable') ||
    text.includes('not available in your country') ||
    text.includes('private video') ||
    text.includes('has been removed')
  ) {
    return new StreamResolutionError('unavailable', 404, 'Video no disponible');
  }
  return new StreamResolutionError('unknown', 500, 'No se pudo resolver el audio del video');
}
