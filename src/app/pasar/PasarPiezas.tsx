"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DibujoPieza } from "@/components/DibujoPieza";
import { buscarColor, buscarPieza } from "@/lib/catalogo";
import { pasarPiezas, type FilaPasar } from "./acciones";

export function PasarPiezas({ filas }: { filas: FilaPasar[] }) {
  const router = useRouter();
  const posibles = filas.filter((f) => !f.yaPasada && f.propuesta);
  const [marcadas, setMarcadas] = useState<Set<number>>(() => new Set(posibles.map((f) => f.id)));
  const [aviso, setAviso] = useState<{ texto: string; error: boolean }>();
  const [pasando, empezar] = useTransition();

  const yaPasadas = filas.filter((f) => f.yaPasada).length;
  const sinEquivalencia = filas.filter((f) => !f.yaPasada && !f.propuesta).length;

  function cambiar(id: number) {
    setMarcadas((m) => {
      const n = new Set(m);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function pasar() {
    setAviso(undefined);
    empezar(async () => {
      const r = await pasarPiezas([...marcadas]);
      if (r.error) setAviso({ texto: r.error, error: true });
      else {
        setAviso({ texto: `Listo: ${r.pasadas} piezas enlazadas con Rebrickable.`, error: false });
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Dato n={posibles.length} texto="se pueden pasar" />
        <Dato n={yaPasadas} texto="ya pasadas" />
        <Dato n={sinEquivalencia} texto="sin equivalencia" />
      </div>

      {aviso && (
        <p
          role={aviso.error ? "alert" : "status"}
          className={`rounded-[10px] border p-3 text-sm ${aviso.error ? "border-brick bg-brick-soft text-brick" : "border-line bg-card"}`}
        >
          {aviso.texto}
        </p>
      )}

      <ul className="space-y-2">
        {filas.map((f) => {
          const vieja = buscarPieza(f.pieza);
          const colorViejo = buscarColor(f.color);
          const puede = !f.yaPasada && !!f.propuesta;
          return (
            <li key={f.id} className="rounded-[10px] border border-line bg-card p-2">
              <div className="flex items-center gap-2">
                {/* Ahora */}
                <div className="flex w-[42%] min-w-0 flex-col items-center text-center">
                  {vieja && (
                    <DibujoPieza
                      dibujo={vieja.dibujo}
                      color={colorViejo?.hex}
                      transparente={colorViejo?.transparente}
                      tamano={52}
                    />
                  )}
                  <span className="font-display text-sm font-bold leading-tight">{vieja?.nombre ?? f.pieza}</span>
                  <span className="text-xs text-ink/70">
                    {colorViejo?.nombre ?? "Sin color"} · <span className="font-mono">{f.cantidad}</span> ·{" "}
                    <span className="font-mono">{f.ubicacion ?? "Sin ordenar"}</span>
                  </span>
                </div>

                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-ink/40" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>

                {/* Rebrickable */}
                <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                  {f.propuesta ? (
                    <>
                      {f.propuesta.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.propuesta.foto}
                          alt={f.propuesta.nombre}
                          width={64}
                          height={64}
                          loading="lazy"
                          className="h-16 w-16 object-contain"
                        />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center text-xs text-ink/50">Sin foto</span>
                      )}
                      <span className="text-xs leading-tight">{f.propuesta.nombre}</span>
                      <span className="font-mono text-[11px] text-ink/60">{f.propuesta.partNum}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-ink/70">
                        {f.colorPropuesto && (
                          <span
                            className="h-3 w-3 rounded-full border border-ink/20"
                            style={{ backgroundColor: f.colorPropuesto.hex, opacity: f.colorPropuesto.transparente ? 0.7 : 1 }}
                          />
                        )}
                        {f.colorPropuesto?.nombre ?? (f.color ? `${colorViejo?.nombre ?? f.color} (se queda igual)` : "Sin color")}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-ink/60">
                      Sin equivalencia: se queda con su dibujo. Podrás elegir la pieza nueva a mano.
                    </span>
                  )}
                </div>
              </div>

              {f.yaPasada ? (
                <p className="mt-2 text-center text-xs font-medium text-ink/60">Ya pasada</p>
              ) : (
                puede && (
                  <label className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-line text-sm">
                    <input
                      type="checkbox"
                      checked={marcadas.has(f.id)}
                      onChange={() => cambiar(f.id)}
                      className="h-5 w-5 accent-[#c91a09]"
                    />
                    Es esta pieza
                  </label>
                )
              )}
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card">
        <div className="mx-auto w-full max-w-[390px] px-4 py-3">
          <button
            type="button"
            onClick={pasar}
            disabled={pasando || marcadas.size === 0}
            className="h-14 w-full rounded-[10px] bg-brick text-lg font-semibold text-white disabled:opacity-50"
          >
            {pasando ? "Pasando…" : `Pasar ${marcadas.size} ${marcadas.size === 1 ? "pieza" : "piezas"}`}
          </button>
        </div>
      </div>
    </>
  );
}

function Dato({ n, texto }: { n: number; texto: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-card p-2">
      <p className="font-mono text-xl">{n}</p>
      <p className="text-xs text-ink/70">{texto}</p>
    </div>
  );
}
