import type { ReactElement } from 'react';
import type { View } from '../App';
import { LibraryIcon, QueueIcon, SearchIcon } from './Icon';

interface BottomNavProps {
  active: View;
  onChange: (view: View) => void;
  queueCount: number;
}

const items: { id: View; label: string }[] = [
  { id: 'search', label: 'Buscar' },
  { id: 'library', label: 'Biblioteca' },
  { id: 'queue', label: 'Cola' },
];

const icons: Record<View, (props: { size?: number }) => ReactElement> = {
  search: SearchIcon,
  library: LibraryIcon,
  queue: QueueIcon,
};

export function BottomNav({ active, onChange, queueCount }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = icons[item.id];
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav__item${active === item.id ? ' bottom-nav__item--active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            <span className="bottom-nav__icon-wrap">
              <Icon size={22} />
              {item.id === 'queue' && queueCount > 0 && (
                <span className="bottom-nav__badge">{queueCount}</span>
              )}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
