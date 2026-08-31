import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../hooks/useLibrary';
import { TrackRow } from './TrackRow';

export function LibraryView() {
  const library = useLibrary();
  const { playTrack, playSimilar, currentTrack, isPlaying } = usePlayer();

  return (
    <section className="view">
      <h2 className="view__title">Mi biblioteca</h2>
      <p className="view__subtitle">
        {library.library.length === 0
          ? 'Todavía no guardaste ninguna canción.'
          : `${library.library.length} canción${library.library.length === 1 ? '' : 'es'} guardada${library.library.length === 1 ? '' : 's'}`}
      </p>

      {library.library.length === 0 ? (
        <div className="empty-state">
          Tocá el corazón en una canción del buscador para guardarla acá.
        </div>
      ) : (
        <div className="track-list">
          {library.library.map((track) => (
            <TrackRow
              key={track.videoId}
              track={track}
              isSaved
              isActive={currentTrack?.videoId === track.videoId}
              isPlayingActive={
                currentTrack?.videoId === track.videoId && isPlaying
              }
              onPlay={() => playTrack(track, library.library)}
              onToggleSave={() => library.remove(track.videoId)}
              onSimilar={() => playSimilar(track)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
