"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cambiarCantidad } from "@/app/acciones";
import { Miniatura } from "@/components/Miniatura";
import { VistaGrande } from "@/components/VistaGrande";
import { claveDeVariante, nombreDeTipo } from "@/lib/agrupar";
import { buscarColor, type Color } from "@/lib/catalogo";
import type { FilaPieza } from "@/lib/piezas";
import { vistaDeFila, type PiezaVista } from "@/lib/vista";

/** Todas las variantes de un tipo, para compararlas: imagen grande, nombre completo y número. */
export function VariantesLista({ filas }: { filas: FilaPieza[] }) {
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [error, setError] = useState<string>();
  const [ampliada, setAmpliada] = useState<{ vista: PiezaVista; color?: Color }>();
  const [, empezar] = useTransition();

  // Cada variante (número de pieza) con sus filas (colores y cajas).
  const variantes = new Map<string, FilaPieza[]>();
  for (const f of filas) {
    const k = claveDeVariante(f);
    variantes.set(k, [...(variantes.get(k) ?? []), f]);
  }
  const lista = [...variantes.entries()].sort(([a], [b]) => a.localeCompare(b, "es", { numeric: true }));

  const cantidad = (f: FilaPieza) => cantidades[f.id] ?? f.cantidad;
  const total = filas.reduce((s, f) => s + cantidad(f), 0);
  const nombreTipo = filas[0].rb ? nombreDeTipo(filas[0].rb.nombre_en) : (vistaDeFila(filas[0])?.nombre ?? "");

  function cambiar(id: number, actual: number, cambio: 1 | -1) {
    const nueva = Math.max(0, Math.min(9999, actual + cambio));
    if (nueva === actual) return;
    setError(undefined);
    setCantidades((c) => ({ ...c, [id]: nueva }));
    empezar(async () => {
      const r = await cambiarCantidad(id, cambio);
      if (r === null) {
        setCantidades((c) => ({ ...c, [id]: (c[id] ?? nueva) - cambio }));
        setError("No se pudo cambiar la cantidad. Revisa la conexión.");
      }
    });
  }

  return (
    <div className="space-y-4 px-4 pt-4 pb-4">
      <div>
        <h2 className="font-display text-xl leading-tight font-bold">{nombreTipo}</h2>
        <p className="mt-1 text-sm text-ink/70">
          <span className="font-mono">{lista.length}</span> variantes · <span className="font-mono">{total}</span>{" "}
          piezas en total
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-[10px] border border-brick bg-brick-soft p-3 text-sm text-brick">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {lista.map(([clave, delVariante]) => {
          const vista = vistaDeFila(delVariante[0]);
          if (!vista) return null;
          // La imagen se enseña en el color de la fila con más piezas.
          const portada = delVariante.reduce((a, b) => (cantidad(b) > cantidad(a) ? b : a));
          const colorPortada = buscarColor(portada.color);
          return (
            <li key={clave} className="rounded-[10px] border border-line bg-card p-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAmpliada({ vista, color: colorPortada })}
                  aria-label={`Ver en grande: ${vista.nombre}`}
                  className="shrink-0 rounded-[8px] border border-line"
                >
                  <Miniatura vista={vista} color={colorPortada} tamano={120} />
                </button>
                <div className="min-w-0 flex-1">
                  {vista.medida && <p className="font-display text-lg leading-tight font-bold">{vista.medida}</p>}
                  <p className="mt-0.5 text-sm leading-snug">{vista.nombre}</p>
                  {vista.partNum && <p className="mt-1 font-mono text-xs text-ink/60">{vista.partNum}</p>}
                </div>
              </div>

              {/* Sus colores y cajas */}
              <ul className="mt-3 space-y-2 border-t border-line pt-3">
                {delVariante.map((f) => {
                  const color = buscarColor(f.color);
                  const n = cantidad(f);
                  return (
                    <li key={f.id} className="flex items-center gap-2">
                      <Link
                        href={`/pieza/${f.id}`}
                        className="flex min-h-11 min-w-0 flex-1 flex-wrap items-center gap-x-1.5 text-sm text-ink/80"
                      >
                        <span
                          aria-hidden="true"
                          className={`h-4 w-4 shrink-0 rounded-full border ${color?.otro ? "border-dashed border-ink/40" : "border-ink/20"}`}
                          style={{ backgroundColor: color?.hex ?? "transparent", opacity: color?.transparente ? 0.75 : 1 }}
                        />
                        <span>{color?.nombre ?? "Sin color"}</span>
                        <span
                          className={`rounded border px-1.5 font-mono text-xs ${
                            f.ubicacion ? "border-line text-ink" : "border-brick bg-brick-soft text-brick"
                          }`}
                        >
                          {f.ubicacion ?? "Sin ordenar"}
                        </span>
                      </Link>
                      <div className="flex shrink-0 items-center">
                        <button
                          type="button"
                          onClick={() => cambiar(f.id, n, -1)}
                          disabled={n === 0}
                          aria-label={`Una menos de ${vista.nombre}`}
                          className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-line text-xl disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className={`w-11 text-center font-mono ${n >= 1000 ? "text-sm" : "text-base"}`}>{n}</span>
                        <button
                          type="button"
                          onClick={() => cambiar(f.id, n, 1)}
                          aria-label={`Una más de ${vista.nombre}`}
                          className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-line text-xl"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>

      {ampliada && (
        <VistaGrande vista={ampliada.vista} color={ampliada.color} onCerrar={() => setAmpliada(undefined)} />
      )}
    </div>
  );
}
