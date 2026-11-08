"use client";

import { useState } from "react";
import { DibujoPieza } from "@/components/DibujoPieza";
import type { Color } from "@/lib/catalogo";
import { COLOR_A_RB } from "@/lib/rebrickable/equivalencias";
import type { PiezaVista } from "@/lib/vista";

/** Imagen de Rebrickable de una pieza en un color concreto. */
function fotoEnColor(partNum: string, colorRb: number): string {
  return `https://cdn.rebrickable.com/media/parts/ldraw/${colorRb}/${encodeURIComponent(partNum)}.png`;
}

/**
 * Imagen pequeña de una pieza:
 * - Pieza de Rebrickable con color elegido → su imagen EN ESE COLOR.
 *   Si Rebrickable no la tiene, la foto normal con una bolita de tu color.
 * - Pieza del catálogo antiguo → el dibujo pintado en su color.
 */
export function Miniatura({ vista, color, tamano = 52 }: { vista: PiezaVista; color?: Color; tamano?: number }) {
  const [fallida, setFallida] = useState<string>();

  const colorRb = color && !color.otro ? COLOR_A_RB[color.id] : undefined;
  const enColor = vista.partNum && colorRb !== undefined ? fotoEnColor(vista.partNum, colorRb) : null;
  const usarEnColor = !!enColor && fallida !== enColor;
  const src = usarEnColor ? enColor : vista.foto;

  if (src) {
    return (
      <span
        className="relative inline-flex shrink-0 items-center justify-center rounded-[8px] bg-white"
        style={{ width: tamano, height: tamano }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src}
          src={src}
          alt=""
          width={tamano}
          height={tamano}
          loading="lazy"
          onError={() => {
            if (usarEnColor) setFallida(enColor);
          }}
          className="h-full w-full object-contain p-0.5"
        />
        {/* La bolita solo hace falta si la foto no está en tu color. */}
        {color && !usarEnColor && (
          <span
            aria-hidden="true"
            className={`absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white ${color.otro ? "outline-1 outline-dashed outline-ink/40" : "outline-1 outline-ink/20"}`}
            style={{ backgroundColor: color.hex, opacity: color.transparente ? 0.75 : 1 }}
          />
        )}
      </span>
    );
  }
  if (vista.dibujo) {
    return (
      <DibujoPieza dibujo={vista.dibujo} color={color?.hex} transparente={color?.transparente} tamano={tamano} />
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[8px] border border-dashed border-ink/30 text-xs text-ink/50"
      style={{ width: tamano, height: tamano }}
    >
      ?
    </span>
  );
}
