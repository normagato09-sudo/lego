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
 * Cuando Rebrickable no tiene el dibujo en ese color: la app busca su foto real en
 * ese color o, si no hay, la repinta en tu color.
 */
function fotoPintada(partNum: string, color: Color, colorRb: number): string {
  const hex = color.hex.replace("#", "");
  return `/api/imagen-color?pieza=${encodeURIComponent(partNum)}&color=${colorRb}&hex=${hex}&trans=${color.transparente ? 1 : 0}`;
}

/**
 * Imagen pequeña de una pieza:
 * 1. Pieza de Rebrickable con color → su imagen EN ESE COLOR.
 * 2. Si Rebrickable no la tiene en ese color → la app la repinta en tu color.
 * 3. Si tampoco se puede → la foto normal con una bolita de tu color.
 * Pieza del catálogo antiguo → el dibujo pintado en su color.
 */
export function Miniatura({ vista, color, tamano = 52 }: { vista: PiezaVista; color?: Color; tamano?: number }) {
  // Imágenes que ya han fallado (para pasar al siguiente intento).
  const [fallos, setFallos] = useState<Record<string, true>>({});

  const colorRb = color && !color.otro ? COLOR_A_RB[color.id] : undefined;
  const intentos = [
    vista.partNum && colorRb !== undefined ? fotoEnColor(vista.partNum, colorRb) : null,
    vista.partNum && color && colorRb !== undefined ? fotoPintada(vista.partNum, color, colorRb) : null,
  ].filter((s): s is string => !!s);
  const src = intentos.find((s) => !fallos[s]);

  const caja = "relative inline-flex shrink-0 items-center justify-center rounded-[8px] bg-white";

  if (src) {
    return (
      <span className={caja} style={{ width: tamano, height: tamano }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src}
          src={src}
          alt=""
          width={tamano}
          height={tamano}
          loading="lazy"
          onError={() => setFallos((f) => ({ ...f, [src]: true }))}
          className="h-full w-full object-contain p-0.5"
        />
      </span>
    );
  }

  if (vista.foto) {
    return (
      <span className={caja} style={{ width: tamano, height: tamano }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={vista.foto}
          alt=""
          width={tamano}
          height={tamano}
          loading="lazy"
          className="h-full w-full object-contain p-0.5"
        />
        {color && (
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
