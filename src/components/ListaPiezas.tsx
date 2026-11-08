"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cambiarCantidad } from "@/app/acciones";
import { DibujoPieza } from "@/components/DibujoPieza";
import { Miniatura } from "@/components/Miniatura";
import { COLORES, FORMAS, PIEZAS, buscarColor, buscarPieza, type FormaId } from "@/lib/catalogo";
import { textoBusqueda } from "@/lib/rebrickable/busqueda";
import { coincide } from "@/lib/texto";
import { vistaDeFila, type DatosRb, type PiezaVista } from "@/lib/vista";

export type FilaLista = {
  id: number;
  pieza: string;
  color: string | null;
  cantidad: number;
  ubicacion: string | null;
  /** Datos de Rebrickable (foto, nombre, categoría) si está enlazada. */
  rb: DatosRb | null;
};

const ELEGIDO = "border-brick bg-brick-soft";
const NORMAL = "border-line bg-card";

const PLURAL: Record<FormaId, string> = {
  alta: "Altas",
  fina: "Finas",
  lisa: "Lisas",
  rampa: "Rampas",
  agujeros: "Agujeros",
  muneco: "Muñecos",
  rara: "Raras",
};

/** Posición de cada pieza en el catálogo, para ordenar la lista igual. */
const ORDEN = new Map(PIEZAS.map((p, i) => [p.id, i]));

/** Las de medida libre van detrás de las de su mismo tipo, de menor a mayor. */
function orden(id: string): number {
  const conocida = ORDEN.get(id);
  if (conocida !== undefined) return conocida;
  const p = buscarPieza(id);
  if (!p) return Number.MAX_SAFE_INTEGER;
  let ultima = 0;
  PIEZAS.forEach((x, i) => {
    if (x.forma === p.forma && x.subtipo === p.subtipo) ultima = i;
  });
  const tamano = p.dibujo.tipo === "arriba" ? p.dibujo.ancho * 100 + p.dibujo.largo : 0;
  return ultima + 0.5 + tamano / 1e6;
}

/** Orden dentro de cada forma: primero las del catálogo antiguo, luego las de Rebrickable por medida. */
function claveOrden(v: PiezaVista, pieza: string): [number, number, number, string] {
  if (!v.partNum) return [0, orden(pieza), 0, ""];
  const n = (v.medida ?? "").match(/\d+/g)?.map(Number) ?? [];
  return [1, n[0] ?? 999, n[1] ?? 999, `${v.categoria ?? ""} ${v.nombre}`];
}

export function ListaPiezas({ filas, ubicacionInicial }: { filas: FilaLista[]; ubicacionInicial?: string }) {
  const [busqueda, setBusqueda] = useState("");
  const [formaFiltro, setFormaFiltro] = useState<FormaId>();
  const [colorFiltro, setColorFiltro] = useState<string>();
  // "sin" = solo las piezas sin ordenar; un código = solo esa bolsa.
  const [ubicacionFiltro, setUbicacionFiltro] = useState(ubicacionInicial);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [error, setError] = useState<string>();
  const [, empezar] = useTransition();

  // Cada fila con su pieza y color del catálogo (y la cantidad al día).
  const todas = filas
    .map((f) => ({
      ...f,
      cantidad: cantidades[f.id] ?? f.cantidad,
      vista: vistaDeFila(f),
      colorDatos: buscarColor(f.color),
    }))
    .filter((f) => f.vista !== undefined)
    .sort((a, b) => {
      const ka = claveOrden(a.vista!, a.pieza);
      const kb = claveOrden(b.vista!, b.pieza);
      return (
        ka[0] - kb[0] ||
        ka[1] - kb[1] ||
        ka[2] - kb[2] ||
        ka[3].localeCompare(kb[3]) ||
        (a.color ?? "").localeCompare(b.color ?? "") ||
        (a.ubicacion ?? "").localeCompare(b.ubicacion ?? "", "es", { numeric: true })
      );
    });

  const otrosUsados = [
    ...new Map(
      filas
        .map((f) => buscarColor(f.color))
        .filter((c) => c?.otro)
        .map((c) => [c!.id, c!]),
    ).values(),
  ];
  const coloresUsados = [...COLORES.filter((c) => filas.some((f) => f.color === c.id)), ...otrosUsados];

  const visibles = todas.filter((f) => {
    if (formaFiltro && f.vista!.forma !== formaFiltro) return false;
    if (colorFiltro && f.color !== colorFiltro) return false;
    if (ubicacionFiltro === "sin" ? f.ubicacion : ubicacionFiltro && f.ubicacion !== ubicacionFiltro) return false;
    if (busqueda.trim()) {
      const forma = FORMAS.find((x) => x.id === f.vista!.forma)!;
      const v = f.vista!;
      const texto = [
        v.partNum ? textoBusqueda(v.partNum, v.nombre, v.categoria ?? "") : v.nombre,
        forma.nombre,
        v.categoria ?? "",
        v.medida ?? "",
        f.colorDatos?.nombre ?? "sin color",
        f.ubicacion ?? "sin ordenar",
      ].join(" ");
      if (!coincide(texto, busqueda)) return false;
    }
    return true;
  });

  const totalPiezas = visibles.reduce((s, f) => s + f.cantidad, 0);
  const sinOrdenar = visibles.filter((f) => !f.ubicacion).reduce((s, f) => s + f.cantidad, 0);

  function cambiar(id: number, actual: number, cambio: 1 | -1) {
    const nueva = Math.max(0, Math.min(9999, actual + cambio));
    if (nueva === actual) return;
    setError(undefined);
    setCantidades((c) => ({ ...c, [id]: nueva }));
    empezar(async () => {
      const r = await cambiarCantidad(id, cambio);
      if (r === null) {
        // Si no se pudo guardar, se deshace el cambio.
        setCantidades((c) => ({ ...c, [id]: (c[id] ?? nueva) - cambio }));
        setError("No se pudo cambiar la cantidad. Revisa la conexión.");
      }
    });
  }

  return (
    <div className="space-y-4 px-4 pt-4 pb-28">
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar: 2x4, beige, C2-B01…"
        aria-label="Buscar piezas"
        className="h-12 w-full rounded-[10px] border border-line bg-card px-4 text-base outline-none focus:border-brick"
      />

      {/* Filtros por forma */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setFormaFiltro(undefined)}
          aria-pressed={!formaFiltro}
          className={`flex h-[72px] min-w-[64px] shrink-0 flex-col items-center justify-center gap-1 rounded-[10px] border px-2 ${!formaFiltro ? ELEGIDO : NORMAL}`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
          </svg>
          <span className="text-xs font-medium">Todas</span>
        </button>
        {FORMAS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFormaFiltro(formaFiltro === f.id ? undefined : f.id)}
            aria-pressed={formaFiltro === f.id}
            className={`flex h-[72px] min-w-[64px] shrink-0 flex-col items-center justify-center gap-1 rounded-[10px] border px-2 ${formaFiltro === f.id ? ELEGIDO : NORMAL}`}
          >
            <DibujoPieza dibujo={buscarPieza(f.icono)!.dibujo} tamano={32} />
            <span className="text-xs font-medium">{PLURAL[f.id]}</span>
          </button>
        ))}
      </div>

      {/* Filtro por color (solo los colores que hay) */}
      {coloresUsados.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por color">
          {coloresUsados.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColorFiltro(colorFiltro === c.id ? undefined : c.id)}
              aria-pressed={colorFiltro === c.id}
              aria-label={c.nombre}
              title={c.nombre}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${colorFiltro === c.id ? "border-brick" : "border-transparent"}`}
            >
              <span
                className={`h-8 w-8 rounded-full border ${c.otro ? "border-2 border-dashed border-ink/40" : "border-ink/20"}`}
                style={{ backgroundColor: c.hex, opacity: c.transparente ? 0.7 : 1 }}
              />
            </button>
          ))}
        </div>
      )}

      {ubicacionFiltro && (
        <div className="flex items-center gap-2 rounded-[10px] border border-brick bg-brick-soft p-2 pl-3 text-sm">
          <span className="flex-1">
            Mostrando:{" "}
            <strong className="font-mono">{ubicacionFiltro === "sin" ? "Sin ordenar" : ubicacionFiltro}</strong>
          </span>
          <button
            type="button"
            onClick={() => setUbicacionFiltro(undefined)}
            className="h-11 rounded-[10px] border border-line bg-card px-3 font-semibold"
          >
            Ver todas
          </button>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2">
        <Dato numero={visibles.length} texto={visibles.length === 1 ? "tipo" : "tipos"} />
        <Dato numero={totalPiezas} texto="piezas" />
        <Dato numero={sinOrdenar} texto="sin ordenar" rojo />
      </div>

      {error && (
        <p role="alert" className="rounded-[10px] border border-brick bg-brick-soft p-3 text-sm text-brick">
          {error}
        </p>
      )}

      {filas.length === 0 ? (
        <p className="rounded-[10px] border border-line bg-card p-4 text-center text-ink/70">
          Todavía no hay piezas. Pulsa <strong>Añadir pieza</strong> para empezar.
        </p>
      ) : visibles.length === 0 ? (
        <p className="rounded-[10px] border border-line bg-card p-4 text-center text-ink/70">
          No hay piezas con esa búsqueda o filtro.
        </p>
      ) : (
        FORMAS.map((forma) => {
          const grupo = visibles.filter((f) => f.vista!.forma === forma.id);
          if (grupo.length === 0) return null;
          return (
            <section key={forma.id}>
              <h2 className="font-display text-lg font-bold">
                {PLURAL[forma.id]}{" "}
                <span className="font-mono text-sm font-normal text-ink/60">
                  {grupo.reduce((s, f) => s + f.cantidad, 0)}
                </span>
              </h2>
              <ul className="mt-2 space-y-2">
                {grupo.map((f) => {
                  const v = f.vista!;
                  // La categoría se enseña si ayuda a distinguir (no en las rectangulares antiguas).
                  const verCategoria =
                    !!v.categoria && (!!v.partNum || (v.categoria !== "Rectangulares" && forma.id !== "muneco"));
                  return (
                    <li key={f.id} className="flex items-center gap-2 rounded-[10px] border border-line bg-card p-2">
                      <Link href={`/pieza/${f.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                        <Miniatura vista={v} color={f.colorDatos} tamano={52} />
                        <div className="min-w-0">
                          <p className="truncate font-display text-lg font-bold leading-tight">
                            {v.medida ?? (v.partNum ? v.categoria : v.nombre)}
                            {verCategoria && v.medida && (
                              <span className="ml-1 font-sans text-xs font-normal text-ink/60">{v.categoria}</span>
                            )}
                          </p>
                          {v.partNum && <p className="truncate text-[11px] leading-tight text-ink/50">{v.nombre}</p>}
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-ink/70">
                            <span>{f.colorDatos?.nombre ?? "Sin color"}</span>
                            <span
                              className={`rounded border px-1.5 font-mono text-xs ${
                                f.ubicacion ? "border-line text-ink" : "border-brick bg-brick-soft text-brick"
                              }`}
                            >
                              {f.ubicacion ?? "Sin ordenar"}
                            </span>
                          </p>
                        </div>
                      </Link>
                      <div className="flex shrink-0 items-center">
                        <button
                          type="button"
                          onClick={() => cambiar(f.id, f.cantidad, -1)}
                          disabled={f.cantidad === 0}
                          aria-label={`Una menos de ${f.vista!.nombre}`}
                          className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-line text-xl disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className={`w-11 text-center font-mono ${f.cantidad >= 1000 ? "text-sm" : "text-base"}`}>{f.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => cambiar(f.id, f.cantidad, 1)}
                          aria-label={`Una más de ${f.vista!.nombre}`}
                          className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-line text-xl"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

function Dato({ numero, texto, rojo = false }: { numero: number; texto: string; rojo?: boolean }) {
  return (
    <div className={`rounded-[10px] border p-2 text-center ${rojo ? "border-brick bg-brick-soft" : "border-line bg-card"}`}>
      <p className={`font-mono text-xl ${rojo ? "text-brick" : ""}`}>{numero}</p>
      <p className={`text-xs ${rojo ? "text-brick" : "text-ink/70"}`}>{texto}</p>
    </div>
  );
}
