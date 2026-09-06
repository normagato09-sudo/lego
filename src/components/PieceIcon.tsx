type Props = {
  className?: string;
};

/**
 * Icono genérico de pieza (silueta de stud), usado como placeholder cuando
 * una pieza no tiene foto. Antes estaba duplicado tal cual en PieceCard.tsx
 * y en PiecePhotoField.tsx.
 */
export function PieceIcon({ className = "h-6 w-9 text-ink-soft/40" }: Props) {
  return (
    <svg viewBox="0 0 40 28" className={className} aria-hidden="true">
      <rect x="2" y="8" width="36" height="18" rx="2" fill="currentColor" />
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <circle cx="20" cy="8" r="4" fill="currentColor" />
      <circle cx="28" cy="8" r="4" fill="currentColor" />
    </svg>
  );
}
