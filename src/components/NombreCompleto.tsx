"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

const PULSACION_LARGA_MS = 500;

/**
 * Nombre de una pieza en hasta 3 líneas. Si aun así no cabe:
 * - con el ratón, se ve completo al pasar por encima (tooltip del navegador);
 * - en el móvil, manteniendo pulsado sale una burbuja con el nombre completo.
 * Después de una pulsación larga no se abre la tarjeta (solo se lee el nombre).
 */
export function NombreCompleto({ texto, className = "" }: { texto: string; className?: string }) {
  const [abierta, setAbierta] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fuePulsacionLarga = useRef(false);

  // La burbuja se cierra sola al tocar en cualquier otro sitio o a los 4 segundos.
  useEffect(() => {
    if (!abierta) return;
    const cerrar = () => setAbierta(false);
    const reloj = setTimeout(cerrar, 4000);
    document.addEventListener("touchstart", cerrar, { passive: true });
    document.addEventListener("scroll", cerrar, { passive: true, capture: true });
    return () => {
      clearTimeout(reloj);
      document.removeEventListener("touchstart", cerrar);
      document.removeEventListener("scroll", cerrar, { capture: true });
    };
  }, [abierta]);

  function empezar() {
    fuePulsacionLarga.current = false;
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      fuePulsacionLarga.current = true;
      setAbierta(true);
    }, PULSACION_LARGA_MS);
  }

  function cancelar() {
    clearTimeout(temporizador.current);
  }

  function alPulsar(e: MouseEvent) {
    // Si se acaba de mantener pulsado, ese toque no abre la tarjeta.
    if (fuePulsacionLarga.current) {
      e.preventDefault();
      e.stopPropagation();
      fuePulsacionLarga.current = false;
    }
  }

  return (
    <span className="relative block">
      <span
        title={texto}
        onTouchStart={empezar}
        onTouchEnd={cancelar}
        onTouchMove={cancelar}
        onTouchCancel={cancelar}
        onClickCapture={alPulsar}
        onContextMenu={(e) => {
          // En el móvil, que mantener pulsado no saque el menú del enlace.
          if (fuePulsacionLarga.current) e.preventDefault();
        }}
        className={`line-clamp-3 select-none [-webkit-touch-callout:none] ${className}`}
      >
        {texto}
      </span>
      {abierta && (
        <span
          role="tooltip"
          className="absolute top-full left-0 z-20 mt-1 block w-max max-w-[260px] rounded-[10px] border border-line bg-card p-2 text-xs leading-snug text-ink"
        >
          {texto}
        </span>
      )}
    </span>
  );
}
