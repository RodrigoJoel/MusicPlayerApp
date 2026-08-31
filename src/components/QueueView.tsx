import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../hooks/useLibrary';
import { TrackRow } from './TrackRow';

export function QueueView() {
  const {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    playQueue,
    removeFromQueue,
  } = usePlayer();
  const library = useLibrary();

  return (
    <section className="view">
      <h2 className="view__title">Cola de reproducción</h2>
      <p className="view__subtitle">
        {queue.length === 0
          ? 'La cola está vacía. Reproducí algo o agregá similares.'
          : `${queue.length} canción${queue.length === 1 ? '' : 'es'} en cola`}
      </p>

      {queue.length === 0 ? (
        <div className="empty-state">
          Buscá una canción y tocá el ícono de "similares" para armar una
          cola, como en YouTube o Spotify.
        </div>
      ) : (
        <div className="track-list">
          {queue.map((track, idx) => (
            <TrackRow
              key={`${track.videoId}-${idx}`}
              track={track}
              isSaved={library.isSaved(track.videoId)}
              isActive={idx === currentIndex}
              isPlayingActive={idx === currentIndex && isPlaying}
              onPlay={() => playQueue(queue, idx)}
              onToggleSave={() => library.toggle(track)}
              onRemove={
                track.videoId === currentTrack?.videoId
                  ? undefined
                  : () => removeFromQueue(track.videoId)
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
