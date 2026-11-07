"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { cargarCopia, type FilaCopia } from "@/app/acciones";

/** Botones "Descargar copia" y "Cargar copia" (archivo JSON). */
export function CopiaSeguridad() {
  const router = useRouter();
  const archivo = useRef<HTMLInputElement>(null);
  const [pendiente, setPendiente] = useState<{ nombre: string; filas: FilaCopia[] }>();
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean }>();
  const [cargando, empezar] = useTransition();

  async function leerArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const elegido = e.target.files?.[0];
    e.target.value = ""; // para poder elegir el mismo archivo otra vez
    if (!elegido) return;
    setMensaje(undefined);
    try {
      const datos = JSON.parse(await elegido.text());
      if (!datos || !Array.isArray(datos.piezas)) throw new Error("sin piezas");
      setPendiente({ nombre: elegido.name, filas: datos.piezas });
    } catch {
      setMensaje({ texto: "Ese archivo no es una copia de LEGO Inventario.", error: true });
    }
  }

  function confirmar() {
    if (!pendiente) return;
    empezar(async () => {
      const r = await cargarCopia(pendiente.filas);
      setPendiente(undefined);
      if (r.error) {
        setMensaje({ texto: r.error, error: true });
      } else {
        setMensaje({ texto: `Copia cargada: ${r.cargadas} tipos de pieza.`, error: false });
        router.refresh();
      }
    });
  }

  const piezas = pendiente?.filas.reduce((s, f) => s + (Number(f?.cantidad) || 0), 0) ?? 0;

  return (
    <section className="space-y-3 border-t border-line pt-4">
      <h2 className="font-display text-lg font-bold">Copia de seguridad</h2>
      <div className="grid grid-cols-2 gap-2">
        <a
          href="/api/copia"
          download
          className="flex h-12 items-center justify-center gap-2 rounded-[10px] border border-line bg-card font-semibold"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
          </svg>
          Descargar copia
        </a>
        <button
          type="button"
          onClick={() => archivo.current?.click()}
          className="flex h-12 items-center justify-center gap-2 rounded-[10px] border border-line bg-card font-semibold"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 15V4M7 9l5-5 5 5M5 20h14" />
          </svg>
          Cargar copia
        </button>
        <input ref={archivo} type="file" accept=".json,application/json" onChange={leerArchivo} className="hidden" />
      </div>

      {pendiente && (
        <div className="rounded-[10px] border border-brick bg-brick-soft p-3">
          <p className="font-medium">
            La copia «{pendiente.nombre}» tiene {pendiente.filas.length} tipos ({piezas} piezas).
          </p>
          <p className="mt-1 text-sm text-brick">
            Al cargarla se borra todo lo que hay ahora en la app y se pone lo de la copia.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={confirmar}
              disabled={cargando}
              className="h-11 flex-1 rounded-[10px] bg-brick font-semibold text-white disabled:opacity-60"
            >
              {cargando ? "Cargando…" : "Sí, cargar"}
            </button>
            <button
              type="button"
              onClick={() => setPendiente(undefined)}
              disabled={cargando}
              className="h-11 flex-1 rounded-[10px] border border-line bg-card font-semibold"
            >
              No
            </button>
          </div>
        </div>
      )}

      {mensaje && (
        <p
          role={mensaje.error ? "alert" : "status"}
          className={`rounded-[10px] border p-3 text-sm ${mensaje.error ? "border-brick bg-brick-soft text-brick" : "border-line bg-card"}`}
        >
          {mensaje.texto}
        </p>
      )}
    </section>
  );
}
