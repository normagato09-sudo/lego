"use client";

import { useEffect, useRef } from "react";
import { Miniatura } from "@/components/Miniatura";
import type { Color } from "@/lib/catalogo";
import type { PiezaVista } from "@/lib/vista";

/**
 * Ventana con la pieza en grande: imagen, nombre completo y número de pieza.
 * Se cierra con la X, pulsando fuera o con la tecla Escape.
 */
export function VistaGrande({
  vista,
  color,
  onCerrar,
}: {
  vista: PiezaVista;
  color?: Color;
  onCerrar: () => void;
}) {
  const ventana = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // showModal: oscurece el fondo, atrapa el foco y cierra con Escape.
    ventana.current?.showModal();
  }, []);

  const cerrar = () => ventana.current?.close();

  return (
    <dialog
      ref={ventana}
      onClose={onCerrar}
      onClick={(e) => {
        // Pulsar fuera de la tarjeta (en el fondo oscuro) la cierra.
        if (e.target === ventana.current) cerrar();
      }}
      aria-label={vista.nombre}
      className="m-auto w-[min(92vw,420px)] max-h-[90dvh] overflow-y-auto rounded-[10px] border border-line bg-card p-0 text-ink backdrop:bg-ink/60"
    >
      <div className="relative px-4 pt-14 pb-5">
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          autoFocus
          className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-[10px] border border-line bg-card text-ink"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="flex justify-center">
          <Miniatura vista={vista} color={color} tamano={280} />
        </div>

        <h2 className="mt-4 font-sans text-base leading-snug font-semibold">{vista.nombre}</h2>
        {vista.partNum && <p className="mt-1 font-mono text-sm text-ink/60">{vista.partNum}</p>}
      </div>
    </dialog>
  );
}
