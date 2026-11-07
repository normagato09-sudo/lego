import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CabeceraApp } from "@/components/CabeceraApp";
import { CopiaSeguridad } from "@/components/CopiaSeguridad";
import { DibujoPieza } from "@/components/DibujoPieza";
import { agruparPorCajas } from "@/lib/cajas";
import { buscarColor, buscarPieza } from "@/lib/catalogo";
import { leerPiezas, type FilaPieza } from "@/lib/piezas";

export const metadata = { title: "Cajas · LEGO Inventario" };

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

async function Contenido() {
  await connection();
  let filas: FilaPieza[] | null = null;
  try {
    filas = await leerPiezas();
  } catch (e) {
    console.error("No se pudieron leer las piezas", e);
  }
  if (!filas) {
    return (
      <p role="alert" className="rounded-[10px] border border-brick bg-brick-soft p-3 text-sm text-brick">
        No se pudieron cargar las cajas. Revisa la conexión y recarga la página.
      </p>
    );
  }

  const { sinOrdenar, cajas } = agruparPorCajas(filas);

  return (
    <>
      <Link
        href="/?ubicacion=sin"
        className="block rounded-[10px] border-2 border-brick bg-brick-soft p-4 text-brick"
      >
        <p className="font-display text-xl font-bold">Sin ordenar</p>
        <p className="mt-1 text-sm">
          Quedan por guardar <span className="font-mono">{plural(sinOrdenar.tipos, "tipo", "tipos")}</span> ·{" "}
          <span className="font-mono">{plural(sinOrdenar.piezas, "pieza", "piezas")}</span>
        </p>
      </Link>

      {cajas.length === 0 ? (
        <p className="rounded-[10px] border border-line bg-card p-4 text-center text-ink/70">
          Todavía no hay piezas guardadas en ninguna caja.
        </p>
      ) : (
        cajas.map((caja) => (
          <section key={caja.codigo} className="rounded-[10px] border border-line bg-card p-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold">
                {caja.nombre}{" "}
                {caja.nombre !== caja.codigo && (
                  <span className="font-mono text-sm font-normal text-ink/60">{caja.codigo}</span>
                )}
              </h2>
            </div>
            <p className="text-sm text-ink/70">
              {plural(caja.bolsas.length, "bolsa", "bolsas")} · {plural(caja.tipos, "tipo", "tipos")} ·{" "}
              {plural(caja.piezas, "pieza", "piezas")}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {caja.bolsas.map((bolsa) => {
                const pieza = buscarPieza(bolsa.principal.pieza);
                const color = buscarColor(bolsa.principal.color);
                return (
                  <Link
                    key={bolsa.codigo}
                    href={`/?ubicacion=${encodeURIComponent(bolsa.codigo)}`}
                    className="flex min-h-[112px] flex-col items-center gap-1 rounded-[10px] border border-line bg-fog p-2 text-center"
                  >
                    <span className="max-w-full font-mono text-sm font-medium break-all">{bolsa.codigo}</span>
                    {pieza && (
                      <DibujoPieza dibujo={pieza.dibujo} color={color?.hex} transparente={color?.transparente} tamano={36} />
                    )}
                    <span className="line-clamp-2 text-xs leading-tight">
                      {pieza?.nombre ?? "Pieza"}
                      {bolsa.tipos > 1 && <span className="text-ink/60"> y {bolsa.tipos - 1} más</span>}
                    </span>
                    <span className="font-mono text-xs text-ink/70">{plural(bolsa.piezas, "pieza", "piezas")}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
}

export default function Page() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px]">
      <CabeceraApp activa="cajas" />
      <div className="space-y-4 px-4 pt-4 pb-10">
        <p className="rounded-[10px] border border-line bg-card p-3 text-sm">
          Cada código dice dónde está la pieza: <span className="font-mono font-medium">C2-B03</span> = caja 2,
          bolsa 3.
        </p>
        <Suspense fallback={<p className="text-sm text-ink/60">Cargando cajas…</p>}>
          <Contenido />
        </Suspense>
        <CopiaSeguridad />
      </div>
    </div>
  );
}
