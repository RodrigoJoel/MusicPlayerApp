export type StreamErrorCode =
  | 'invalid_id'
  | 'age_restricted'
  | 'unavailable'
  | 'blocked'
  | 'bot_check'
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
  if (text.includes('blocked due to the claimed content') || text.includes('copyright')) {
    return new StreamResolutionError(
      'blocked',
      403,
      'El dueño de los derechos bloqueó este video para reproducción externa',
    );
  }
  if (text.includes("sign in to confirm you're not a bot") || text.includes('confirm you’re not a bot')) {
    return new StreamResolutionError(
      'bot_check',
      503,
      'YouTube bloqueó temporalmente el servidor por actividad sospechosa',
    );
  }
  return new StreamResolutionError('unknown', 500, 'No se pudo resolver el audio del video');
}
