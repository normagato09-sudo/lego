"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { DibujoPieza } from "@/components/DibujoPieza";
import { Miniatura } from "@/components/Miniatura";
import { FORMAS, buscarPieza, type FormaId } from "@/lib/catalogo";
import { vistaDesdeRb, type DatosRb } from "@/lib/vista";
import { buscarPiezas } from "./buscar";
import { grupoDeCategoria, gruposDeForma, type Grupo } from "./grupos";

const ELEGIDO = "border-brick bg-brick-soft";
const NORMAL = "border-line bg-card";

type Resultados = { piezas: DatosRb[]; hayMas: boolean };

export function ElegirPieza({
  inicial,
  resultadosIniciales,
  editarId,
}: {
  inicial?: DatosRb;
  resultadosIniciales?: Resultados;
  editarId?: number;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [formaId, setFormaId] = useState<FormaId | undefined>(inicial?.forma);
  const [grupo, setGrupo] = useState<Grupo | undefined>(
    inicial ? grupoDeCategoria(inicial.forma, inicial.categoria) : undefined,
  );
  const [elegida, setElegida] = useState<DatosRb | undefined>(inicial);
  const [resultados, setResultados] = useState<Resultados>(resultadosIniciales ?? { piezas: [], hayMas: false });
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string>();

  // Para no mezclar respuestas viejas con nuevas si se escribe rápido.
  const ultimaPeticion = useRef(0);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function cargar(categorias: number[], texto: string, pag: number) {
    const n = ++ultimaPeticion.current;
    setCargando(true);
    setError(undefined);
    const r = await buscarPiezas(categorias, texto, pag);
    if (n !== ultimaPeticion.current) return;
    setCargando(false);
    if (r.error) setError(r.error);
    setPagina(pag);
    setResultados((antes) => (pag === 1 ? r : { piezas: [...antes.piezas, ...r.piezas], hayMas: r.hayMas }));
  }

  function escribir(texto: string) {
    setBusqueda(texto);
    clearTimeout(temporizador.current);
    if (texto.trim()) {
      temporizador.current = setTimeout(() => cargar([], texto, 1), 350);
    } else {
      ultimaPeticion.current++;
      setCargando(false);
      if (grupo) void cargar(grupo.ids, "", 1);
      else setResultados({ piezas: [], hayMas: false });
    }
  }

  function elegirForma(id: FormaId) {
    setFormaId(id);
    const grupos = gruposDeForma(id);
    // Si solo hay un grupo, se abre solo.
    if (grupos.length === 1) elegirGrupo(grupos[0]);
    else {
      setGrupo(undefined);
      ultimaPeticion.current++;
      setResultados({ piezas: [], hayMas: false });
    }
  }

  function elegirGrupo(g: Grupo) {
    setGrupo(g);
    void cargar(g.ids, "", 1);
  }

  const buscando = busqueda.trim() !== "";
  const forma = FORMAS.find((f) => f.id === formaId);
  const grupos = formaId ? gruposDeForma(formaId) : [];

  const cuadricula = (
    <>
      {resultados.piezas.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {resultados.piezas.map((p) => {
            const activa = p.part_num === elegida?.part_num;
            return (
              <button
                key={p.part_num}
                type="button"
                onClick={() => setElegida(p)}
                aria-pressed={activa}
                className={`flex flex-col items-center gap-1 rounded-[10px] border p-1.5 text-center ${activa ? ELEGIDO : NORMAL}`}
              >
                <Miniatura vista={vistaDesdeRb(p)} tamano={88} />
                <span className="font-display text-base font-bold leading-tight">{p.medida ?? "—"}</span>
                <span className="line-clamp-2 text-[11px] leading-tight text-ink/70">{p.nombre_en}</span>
              </button>
            );
          })}
        </div>
      )}
      {cargando && <p className="mt-3 text-sm text-ink/60">Buscando…</p>}
      {!cargando && error && (
        <p role="alert" className="mt-3 rounded-[10px] border border-brick bg-brick-soft p-3 text-sm text-brick">
          {error}
        </p>
      )}
      {!cargando && !error && resultados.piezas.length === 0 && (buscando || grupo) && (
        <p className="mt-3 text-sm text-ink/70">No hay ninguna pieza con eso.</p>
      )}
      {!cargando && resultados.hayMas && (
        <button
          type="button"
          onClick={() => cargar(buscando ? [] : (grupo?.ids ?? []), busqueda, pagina + 1)}
          className="mt-3 h-12 w-full rounded-[10px] border border-line bg-card font-semibold"
        >
          Ver más piezas
        </button>
      )}
    </>
  );

  return (
    <>
      <div className="space-y-6 px-4 pt-4 pb-32">
        <label className="block">
          <span className="sr-only">Buscar pieza</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => escribir(e.target.value)}
            placeholder="Buscar: 1x12, clip, redonda…"
            className="h-12 w-full rounded-[10px] border border-line bg-card px-4 text-base outline-none focus:border-brick"
          />
        </label>

        {buscando ? (
          <section>
            <h2 className="font-display text-lg font-bold">Resultados</h2>
            {cuadricula}
          </section>
        ) : (
          <>
            <section>
              <h2 className="font-display text-lg font-bold">1. ¿A cuál se parece?</h2>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {FORMAS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => elegirForma(f.id)}
                    aria-pressed={f.id === formaId}
                    className={`flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-[10px] border p-1 ${f.id === formaId ? ELEGIDO : NORMAL}`}
                  >
                    <DibujoPieza dibujo={buscarPieza(f.icono)!.dibujo} tamano={44} />
                    <span className="text-sm font-medium">{f.nombre}</span>
                  </button>
                ))}
              </div>
              {forma && <p className="mt-2 text-sm text-ink/70">{forma.explicacion}</p>}
            </section>

            {forma && grupos.length > 1 && (
              <section>
                <h2 className="font-display text-lg font-bold">2. ¿De qué tipo?</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {grupos.map((g) => (
                    <button
                      key={g.nombre}
                      type="button"
                      onClick={() => elegirGrupo(g)}
                      aria-pressed={g.nombre === grupo?.nombre}
                      className={`min-h-11 rounded-full border px-4 py-2 text-left text-sm font-medium ${g.nombre === grupo?.nombre ? ELEGIDO : NORMAL}`}
                    >
                      {g.nombre}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {grupo && (
              <section>
                <h2 className="font-display text-lg font-bold">3. Toca la pieza exacta</h2>
                {cuadricula}
              </section>
            )}
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card">
        <div className="mx-auto flex w-full max-w-[390px] items-center gap-3 px-4 py-3">
          {elegida && <Miniatura vista={vistaDesdeRb(elegida)} tamano={44} />}
          <p className="min-w-0 flex-1 text-sm leading-tight">
            {elegida ? (
              <>
                <strong className="font-display text-base">{elegida.medida ?? elegida.categoria}</strong>
                <span className="block truncate text-xs text-ink/70">{elegida.nombre_en}</span>
              </>
            ) : (
              <span className="text-ink/60">Elige una pieza</span>
            )}
          </p>
          {elegida ? (
            <Link
              href={
                editarId
                  ? `/pieza/${editarId}?rb=${encodeURIComponent(elegida.part_num)}`
                  : `/anadir/detalles?rb=${encodeURIComponent(elegida.part_num)}`
              }
              className="flex h-12 items-center rounded-[10px] bg-brick px-6 font-semibold text-white"
            >
              Siguiente
            </Link>
          ) : (
            <span className="flex h-12 items-center rounded-[10px] bg-line px-6 font-semibold text-ink/50" aria-disabled="true">
              Siguiente
            </span>
          )}
        </div>
      </div>
    </>
  );
}
