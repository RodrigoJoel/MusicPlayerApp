/**
 * Set mínimo de íconos SVG inline (sin dependencias externas).
 * Todos heredan `currentColor` para poder tintarlos por CSS.
 */
type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function PlayIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PauseIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function NextIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" stroke="none" />
      <rect x="17" y="4" width="2.5" height="16" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PrevIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <polygon points="19 4 9 12 19 20 19 4" fill="currentColor" stroke="none" />
      <rect x="4.5" y="4" width="2.5" height="16" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function LibraryIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 3v18" />
      <path d="M9 3v18" />
      <path d="M14 6l6 1.5v13L14 19V6z" />
    </svg>
  );
}

export function QueueIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <line x1="4" y1="6" x2="16" y2="6" />
      <line x1="4" y1="12" x2="16" y2="12" />
      <line x1="4" y1="18" x2="12" y2="18" />
      <polygon points="19 14 19 22 25 18 19 14" fill="currentColor" stroke="none" transform="translate(-2,0)" />
    </svg>
  );
}

export function HeartIcon({ size = 24, className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export function ShuffleSimilarIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  );
}

export function TrashIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export function VolumeIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <polygon points="4 9 8 9 13 4 13 20 8 15 4 15 4 9" fill="currentColor" stroke="none" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </svg>
  );
}

export function PlusIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function RepeatIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
