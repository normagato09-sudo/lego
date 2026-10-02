/** Pie con el crédito al catálogo de Rebrickable (colores, piezas e imágenes). */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <p className="mx-auto max-w-5xl px-5 py-3 text-xs text-steel">
        Datos e imágenes del catálogo:{" "}
        <a
          href="https://rebrickable.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-ink"
        >
          Rebrickable
        </a>
      </p>
    </footer>
  );
}
