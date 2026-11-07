import { DibujoPieza } from "@/components/DibujoPieza";
import { COLORES, FORMAS, buscarPieza } from "@/lib/catalogo";

// Página TEMPORAL (paso 4) para revisar el catálogo y los dibujos.
// En los pasos 5 y 6 se cambia por la pantalla de Piezas.
export default function Home() {
  const muestra = buscarPieza("fina-rect-2x4")!;
  return (
    <main className="mx-auto w-full max-w-[390px] px-4 py-6">
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
    </main>
  );
}
