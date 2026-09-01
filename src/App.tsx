import { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { LibraryView } from './components/LibraryView';
import { NoteIcon } from './components/NoteIcon';
import { NowPlayingBar } from './components/NowPlayingBar';
import { QueueView } from './components/QueueView';
import { SearchView } from './components/SearchView';
import { PlayerProvider, usePlayer } from './context/PlayerContext';

export type View = 'search' | 'library' | 'queue';

function AppShell() {
  const [view, setView] = useState<View>('search');
  const { queue } = usePlayer();

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header__logo">
          <NoteIcon />
        </span>
        <span className="app-header__name">
          Music
          <NoteIcon className="app-header__name-note" />
          <span className="app-header__name-small">androapp</span>
        </span>
      </header>

      <main className="app-main">
        {view === 'search' && <SearchView />}
        {view === 'library' && <LibraryView />}
        {view === 'queue' && <QueueView />}
      </main>

      <NowPlayingBar />
      <BottomNav active={view} onChange={setView} queueCount={queue.length} />
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <AppShell />
    </PlayerProvider>
  );
}
