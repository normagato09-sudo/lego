import Link from "next/link";

/** Cabecera principal: logo, nombre y pestañas Piezas / Cajas. */
export function CabeceraApp({ activa }: { activa: "piezas" | "cajas" }) {
  const pestanas = [
    { id: "piezas", nombre: "Piezas", href: "/" },
    { id: "cajas", nombre: "Cajas", href: "/cajas" },
  ] as const;
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-fog/95 backdrop-blur">
      <div className="flex items-center gap-2 px-4 pt-3">
        <svg width="34" height="24" viewBox="0 0 64 44" aria-hidden="true">
          <rect x="10" y="2" width="14" height="8" rx="2" fill="#c91a09" />
          <rect x="40" y="2" width="14" height="8" rx="2" fill="#c91a09" />
          <rect x="2" y="9" width="60" height="33" rx="4" fill="#c91a09" />
        </svg>
        <span className="font-display text-xl font-bold">LEGO Inventario</span>
      </div>
      <nav className="mt-1 flex px-2">
        {pestanas.map((p) =>
          p.id === "cajas" ? (
            // La pantalla Cajas llega en el paso 7.
            <span
              key={p.id}
              aria-disabled="true"
              className="flex h-11 items-center border-b-2 border-transparent px-3 font-medium text-ink/35"
            >
              {p.nombre}
            </span>
          ) : (
            <Link
              key={p.id}
              href={p.href}
              aria-current={p.id === activa ? "page" : undefined}
              className={`flex h-11 items-center border-b-2 px-3 font-medium ${
                p.id === activa ? "border-brick text-ink" : "border-transparent text-ink/60"
              }`}
            >
              {p.nombre}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
}
