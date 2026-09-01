/** Corchea (nota musical) usada como isotipo — misma forma que el ícono de la app. */
export function NoteIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="9.3" cy="17.6" rx="3.3" ry="2.6" />
      <rect x="12.3" y="4" width="2.2" height="13.6" />
      <path d="M14.5 4 L19.4 6.7 L18 9.4 L14.5 7.6 Z" />
    </svg>
  );
}
