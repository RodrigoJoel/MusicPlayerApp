import type { Track } from '../types/track';
import {
  HeartIcon,
  PauseIcon,
  PlayIcon,
  ShuffleSimilarIcon,
  TrashIcon,
} from './Icon';

interface TrackRowProps {
  track: Track;
  isSaved: boolean;
  isActive: boolean;
  isPlayingActive: boolean;
  onPlay: () => void;
  onToggleSave: () => void;
  onSimilar?: () => void;
  onRemove?: () => void;
}

export function TrackRow({
  track,
  isSaved,
  isActive,
  isPlayingActive,
  onPlay,
  onToggleSave,
  onSimilar,
  onRemove,
}: TrackRowProps) {
  return (
    <div className={`track-row${isActive ? ' track-row--active' : ''}`}>
      <button
        type="button"
        className="track-row__thumb"
        onClick={onPlay}
        aria-label={isPlayingActive ? `Pausar ${track.title}` : `Reproducir ${track.title}`}
      >
        {track.thumbnail ? (
          <img src={track.thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="track-row__thumb-fallback" />
        )}
        <span className="track-row__play-overlay">
          {isPlayingActive ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
        </span>
      </button>

      <div className="track-row__info" onClick={onPlay}>
        <p className="track-row__title">{track.title}</p>
        <p className="track-row__channel">{track.channelTitle}</p>
      </div>

      <div className="track-row__actions">
        {onSimilar && (
          <button
            type="button"
            className="icon-btn"
            onClick={onSimilar}
            title="Agregar canciones similares a la cola"
            aria-label="Agregar canciones similares a la cola"
          >
            <ShuffleSimilarIcon size={18} />
          </button>
        )}
        <button
          type="button"
          className={`icon-btn${isSaved ? ' icon-btn--active' : ''}`}
          onClick={onToggleSave}
          title={isSaved ? 'Quitar de mi biblioteca' : 'Guardar en mi biblioteca'}
          aria-label={isSaved ? 'Quitar de mi biblioteca' : 'Guardar en mi biblioteca'}
        >
          <HeartIcon size={18} filled={isSaved} />
        </button>
        {onRemove && (
          <button
            type="button"
            className="icon-btn"
            onClick={onRemove}
            title="Quitar"
            aria-label="Quitar"
          >
            <TrashIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
