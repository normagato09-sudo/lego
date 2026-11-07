import Link from "next/link";
import { DibujoPieza } from "@/components/DibujoPieza";
import { COLORES, FORMAS, buscarPieza } from "@/lib/catalogo";

// Página TEMPORAL (paso 4) para revisar el catálogo y los dibujos.
// En el paso 6 se cambia por la pantalla de Piezas.
export default function Home() {
  const muestra = buscarPieza("fina-rect-2x4")!;
  return (
    <main className="mx-auto w-full max-w-[390px] px-4 pt-6 pb-28">
      <h1 className="font-display text-2xl font-bold">Catálogo de piezas</h1>
      <p className="mt-1 text-sm text-ink/70">Vista temporal para revisar los dibujos.</p>

      <section className="mt-6">
        <h2 className="font-display text-lg font-bold">Colores</h2>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {COLORES.map((c) => (
            <div key={c.id} className="flex flex-col items-center gap-1 rounded-[10px] border border-line bg-card p-2">
              <DibujoPieza dibujo={muestra.dibujo} color={c.hex} transparente={c.transparente} tamano={52} />
              <span className="text-center text-[11px] leading-tight">{c.nombre}</span>
            </div>
          ))}
        </div>
      </section>

      {FORMAS.map((forma) => (
        <section key={forma.id} className="mt-8">
          <h2 className="font-display text-lg font-bold">
            {forma.nombre} <span className="text-sm font-normal text-ink/60">· {forma.explicacion}</span>
          </h2>
          {forma.subtipos.map((sub) => (
            <div key={sub.id} className="mt-3">
              <h3 className="text-sm font-semibold text-ink/70">{sub.nombre}</h3>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {sub.piezas.map((pieza) => (
                  <div key={pieza.id} className="flex flex-col items-center gap-1 rounded-[10px] border border-line bg-card p-2">
                    <DibujoPieza dibujo={pieza.dibujo} tamano={52} />
                    <span className="text-center font-display text-xs font-semibold leading-tight">{pieza.medida}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
      <Link
        href="/anadir"
        className="fixed bottom-5 left-1/2 z-10 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full bg-brick px-6 text-base font-semibold text-white"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Añadir pieza
      </Link>
    </main>
  );
}
