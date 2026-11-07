import Link from "next/link";

/** Cabecera de las pantallas de añadir: flecha para volver + título. */
export function CabeceraVolver({ titulo, volverA }: { titulo: string; volverA: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-fog/95 px-2 py-2 backdrop-blur">
      <Link
        href={volverA}
        aria-label="Volver"
        className="flex h-11 w-11 items-center justify-center rounded-[10px] text-ink hover:bg-card"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>
      <h1 className="font-display text-xl font-bold">{titulo}</h1>
    </header>
  );
}
