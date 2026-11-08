import { DibujoPieza } from "@/components/DibujoPieza";
import type { Color } from "@/lib/catalogo";
import type { PiezaVista } from "@/lib/vista";

/**
 * Imagen pequeña de una pieza: la foto de Rebrickable si la tiene
 * (con una bolita de tu color, porque la foto puede ser de otro color)
 * o el dibujo pintado en su color si es del catálogo antiguo.
 */
export function Miniatura({ vista, color, tamano = 52 }: { vista: PiezaVista; color?: Color; tamano?: number }) {
  if (vista.foto) {
    return (
      <span
        className="relative inline-flex shrink-0 items-center justify-center rounded-[8px] bg-white"
        style={{ width: tamano, height: tamano }}
      >
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
