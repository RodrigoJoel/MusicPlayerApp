import { useState } from 'react';
import { usePlayer, YT_PLAYER_ROOT_ID } from '../context/PlayerContext';
import { formatTime } from '../utils/format';
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  VolumeIcon,
} from './Icon';

export function NowPlayingBar() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    repeatMode,
    togglePlay,
    next,
    previous,
    seekTo,
    setVolume,
    cycleRepeat,
  } = usePlayer();

  const [seekValue, setSeekValue] = useState<number | null>(null);
  const [showVolume, setShowVolume] = useState(false);

  const shownProgress = seekValue ?? progress;
  const hasTrack = Boolean(currentTrack);

  return (
    <div className={`now-playing${hasTrack ? '' : ' now-playing--empty'}`}>
      {/* El player real de YouTube vive acá siempre montado, en tamaño mini. */}
      <div className="now-playing__video">
        <div id={YT_PLAYER_ROOT_ID} />
        {!hasTrack && <div className="now-playing__video-placeholder" />}
      </div>

      {hasTrack ? (
        <>
          <div className="now-playing__info">
            <p className="now-playing__title">{currentTrack!.title}</p>
            <p className="now-playing__channel">{currentTrack!.channelTitle}</p>
          </div>

          <div className="now-playing__center">
            <div className="now-playing__controls">
              <button
                type="button"
                className="icon-btn"
                onClick={previous}
                aria-label="Anterior"
              >
                <PrevIcon size={20} />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--primary"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={next}
                aria-label="Siguiente"
              >
                <NextIcon size={20} />
              </button>
              <button
                type="button"
                className={`icon-btn${repeatMode !== 'off' ? ' icon-btn--active' : ''}`}
                onClick={cycleRepeat}
                title={`Repetir: ${repeatMode === 'off' ? 'desactivado' : repeatMode === 'all' ? 'toda la cola' : 'una canción'}`}
                aria-label="Cambiar modo de repetición"
              >
                <RepeatIcon size={18} />
                {repeatMode === 'one' && <span className="badge-one">1</span>}
              </button>
            </div>

            <div className="now-playing__progress">
              <span className="now-playing__time">{formatTime(shownProgress)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={1}
                value={shownProgress}
                onChange={(e) => setSeekValue(Number(e.target.value))}
                onMouseUp={() => {
                  if (seekValue !== null) seekTo(seekValue);
                  setSeekValue(null);
                }}
                onTouchEnd={() => {
                  if (seekValue !== null) seekTo(seekValue);
                  setSeekValue(null);
                }}
                aria-label="Progreso de la canción"
              />
              <span className="now-playing__time">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="now-playing__volume">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowVolume((v) => !v)}
              aria-label="Volumen"
            >
              <VolumeIcon size={18} />
            </button>
            {showVolume && (
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="now-playing__volume-slider"
                aria-label="Control de volumen"
              />
            )}
          </div>
        </>
      ) : (
        <div className="now-playing__info now-playing__info--empty">
          <p className="now-playing__title">Nada sonando todavía</p>
          <p className="now-playing__channel">
            Buscá una canción para empezar a escuchar
          </p>
        </div>
      )}
    </div>
  );
}
