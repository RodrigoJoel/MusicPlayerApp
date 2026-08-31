/**
 * Representa una canción/video reproducible. El "backend" de reproducción es
 * siempre un video de YouTube (id de 11 caracteres), pero el resto de los
 * campos se muestran como si fuera una canción de un reproductor musical.
 */
export interface Track {
  /** ID del video de YouTube (usado para reproducir vía IFrame Player API) */
  videoId: string;
  /** Título del video / canción */
  title: string;
  /** Nombre del canal de YouTube (se muestra como "artista") */
  channelTitle: string;
  /** URL de la miniatura */
  thumbnail: string;
  /** Fecha de publicación ISO (opcional, no siempre se usa en la UI) */
  publishedAt?: string;
}

/** Track guardado en la biblioteca, con metadata extra */
export interface LibraryTrack extends Track {
  savedAt: number;
}

export type RepeatMode = 'off' | 'all' | 'one';
