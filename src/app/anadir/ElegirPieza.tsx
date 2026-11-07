"use client";

import Link from "next/link";
import { useState } from "react";
import { DibujoPieza } from "@/components/DibujoPieza";
import {
  FORMAS,
  MEDIDA_MAXIMA,
  PIEZAS,
  buscarPieza,
  esFormaRectangular,
  piezaRectangular,
  type FormaId,
  type FormaRectangular,
  type Pieza,
} from "@/lib/catalogo";
import { coincide } from "@/lib/texto";

const ELEGIDO = "border-brick bg-brick-soft";
const NORMAL = "border-line bg-card";

export function ElegirPieza({ piezaInicial, editarId }: { piezaInicial?: string; editarId?: number }) {
  const inicial = piezaInicial ? buscarPieza(piezaInicial) : undefined;
  const [busqueda, setBusqueda] = useState("");
  const [formaId, setFormaId] = useState<FormaId | undefined>(inicial?.forma);
  const [subtipoId, setSubtipoId] = useState<string | undefined>(inicial?.subtipo);
  const [elegida, setElegida] = useState<Pieza | undefined>(inicial);
  // Panel "+ Otra medida" abierto. Se abre solo si la pieza que llega no está en la lista.
  const [otraMedida, setOtraMedida] = useState(
    !!inicial && inicial.subtipo === "rect" && esFormaRectangular(inicial.forma) && !PIEZAS.some((p) => p.id === inicial.id),
  );

  const forma = FORMAS.find((f) => f.id === formaId);
  const subtipo = forma?.subtipos.find((s) => s.id === subtipoId);
  const buscando = busqueda.trim() !== "";
  const resultados = buscando
    ? PIEZAS.filter((p) => {
        const f = FORMAS.find((x) => x.id === p.forma)!;
        const s = f.subtipos.find((x) => x.id === p.subtipo)!;
        return coincide(`${p.nombre} ${f.nombre} ${s.nombre}`, busqueda);
      })
    : [];

  function elegirForma(id: FormaId) {
    setFormaId(id);
    setOtraMedida(false);
    const f = FORMAS.find((x) => x.id === id)!;
    // Si solo hay un tipo, se elige solo.
    setSubtipoId(f.subtipos.length === 1 ? f.subtipos[0].id : undefined);
  }

  function abrirOtraMedida() {
    if (!forma || !esFormaRectangular(forma.id)) return;
    const f = forma.id;
    // Empieza con la medida que ya estaba elegida (si es de esta forma) o con 1 × 1.
    setElegida((actual) =>
      actual && actual.forma === f && actual.subtipo === "rect" ? actual : piezaRectangular(f, 1, 1),
    );
    setOtraMedida(true);
  }

  return (
    <>
      <div className="space-y-6 px-4 pt-4 pb-32">
        <label className="block">
          <span className="sr-only">Buscar pieza</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar: 2x4, redonda, rueda…"
            className="h-12 w-full rounded-[10px] border border-line bg-card px-4 text-base outline-none focus:border-brick"
          />
        </label>

        {buscando ? (
          <section>
            <h2 className="font-display text-lg font-bold">Resultados</h2>
            {resultados.length === 0 ? (
              <p className="mt-2 text-sm text-ink/70">No hay ninguna pieza con ese nombre.</p>
            ) : (
              <CuadriculaPiezas piezas={resultados} elegida={elegida} onElegir={setElegida} conNombre />
            )}
          </section>
        ) : (
          <>
            <section>
              <h2 className="font-display text-lg font-bold">1. ¿A cuál se parece?</h2>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {FORMAS.map((f) => {
                  const icono = buscarPieza(f.icono)!;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => elegirForma(f.id)}
                      aria-pressed={f.id === formaId}
                      className={`flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-[10px] border p-1 ${f.id === formaId ? ELEGIDO : NORMAL}`}
                    >
                      <DibujoPieza dibujo={icono.dibujo} tamano={44} />
                      <span className="text-sm font-medium">{f.nombre}</span>
                    </button>
                  );
                })}
              </div>
              {forma && <p className="mt-2 text-sm text-ink/70">{forma.explicacion}</p>}
            </section>

            {forma && (
              <section>
                <h2 className="font-display text-lg font-bold">2. ¿De qué tipo?</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {forma.subtipos.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSubtipoId(s.id);
                        setOtraMedida(false);
                      }}
                      aria-pressed={s.id === subtipoId}
                      className={`h-11 rounded-full border px-4 text-sm font-medium ${s.id === subtipoId ? ELEGIDO : NORMAL}`}
                    >
                      {s.nombre}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {subtipo && (
              <section>
                <h2 className="font-display text-lg font-bold">3. Toca la pieza exacta</h2>
                <CuadriculaPiezas
                  piezas={subtipo.piezas}
                  elegida={otraMedida ? undefined : elegida}
                  onElegir={(p) => {
                    setElegida(p);
                    setOtraMedida(false);
                  }}
                  otraMedida={
                    subtipo.id === "rect" && forma && esFormaRectangular(forma.id)
                      ? { activa: otraMedida, onClick: abrirOtraMedida }
                      : undefined
                  }
                />
                {otraMedida && forma && esFormaRectangular(forma.id) && elegida && (
                  <PanelOtraMedida key={forma.id} forma={forma.id} inicial={elegida} onCambio={setElegida} />
                )}
              </section>
            )}
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card">
        <div className="mx-auto flex w-full max-w-[390px] items-center gap-3 px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-sm">
            {elegida ? (
              <>
                Elegida: <strong className="font-display text-base">{elegida.nombre}</strong>
              </>
            ) : (
              <span className="text-ink/60">Elige una pieza</span>
            )}
          </p>
          {elegida ? (
            <Link
              href={editarId ? `/pieza/${editarId}?pieza=${elegida.id}` : `/anadir/detalles?pieza=${elegida.id}`}
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

function CuadriculaPiezas({
  piezas,
  elegida,
  onElegir,
  conNombre = false,
  otraMedida,
}: {
  piezas: Pieza[];
  elegida?: Pieza;
  onElegir: (p: Pieza) => void;
  conNombre?: boolean;
  /** Si llega, se añade al final el botón "+ Otra medida". */
  otraMedida?: { activa: boolean; onClick: () => void };
}) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-2">
      {piezas.map((p) => {
        const activa = p.id === elegida?.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onElegir(p)}
            aria-pressed={activa}
            className={`flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-[10px] border p-1 ${activa ? ELEGIDO : NORMAL}`}
          >
            <DibujoPieza dibujo={p.dibujo} tamano={48} />
            <span className="text-center font-display text-xs font-semibold leading-tight">
              {conNombre ? p.nombre : p.medida}
            </span>
          </button>
        );
      })}
      {otraMedida && (
        <button
          type="button"
          onClick={otraMedida.onClick}
          aria-pressed={otraMedida.activa}
          className={`flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed p-1 ${otraMedida.activa ? "border-brick bg-brick-soft" : "border-ink/30 bg-card"}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-center font-display text-xs font-semibold leading-tight">Otra medida</span>
        </button>
      )}
    </div>
  );
}

/** Elegir una medida que no está en la lista: ancho × largo en tetones. */
function PanelOtraMedida({
  forma,
  inicial,
  onCambio,
}: {
  forma: FormaRectangular;
  inicial: Pieza;
  onCambio: (p: Pieza) => void;
}) {
  const [ancho, setAncho] = useState(inicial.dibujo.tipo === "arriba" ? inicial.dibujo.ancho : 1);
  const [largo, setLargo] = useState(inicial.dibujo.tipo === "arriba" ? inicial.dibujo.largo : 1);
  const pieza = piezaRectangular(forma, ancho, largo);

  function cambiar(nuevoAncho: number, nuevoLargo: number) {
    const a = Math.max(1, Math.min(MEDIDA_MAXIMA, nuevoAncho));
    const l = Math.max(1, Math.min(MEDIDA_MAXIMA, nuevoLargo));
    setAncho(a);
    setLargo(l);
    onCambio(piezaRectangular(forma, a, l));
  }

  return (
    <div className="mt-3 space-y-3 rounded-[10px] border border-brick bg-card p-3">
      <div className="flex items-center gap-3">
        <DibujoPieza dibujo={pieza.dibujo} tamano={72} />
        <p className="font-display text-xl font-bold leading-tight">{pieza.nombre}</p>
      </div>
      <Contador texto="Ancho (tetones)" valor={ancho} onCambio={(n) => cambiar(n, largo)} />
      <Contador texto="Largo (tetones)" valor={largo} onCambio={(n) => cambiar(ancho, n)} />
    </div>
  );
}

function Contador({ texto, valor, onCambio }: { texto: string; valor: number; onCambio: (n: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 text-sm font-medium">{texto}</span>
      <button
        type="button"
        onClick={() => onCambio(valor - 1)}
        disabled={valor <= 1}
        aria-label={`${texto}: uno menos`}
        className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-line bg-card text-xl disabled:opacity-30"
      >
        −
      </button>
      <span className="w-8 text-center font-mono text-lg">{valor}</span>
      <button
        type="button"
        onClick={() => onCambio(valor + 1)}
        disabled={valor >= MEDIDA_MAXIMA}
        aria-label={`${texto}: uno más`}
        className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-line bg-card text-xl disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
