import { FORMAS, buscarPieza, type Dibujo, type FormaId } from "@/lib/catalogo";

// Una forma común de mostrar cualquier pieza, venga del catálogo de Rebrickable
// (con foto) o del catálogo antiguo de la app (con dibujo).

/** Datos de una pieza de Rebrickable, tal como salen de la base de datos. */
export type DatosRb = {
  part_num: string;
  nombre_en: string;
  medida: string | null;
  foto: string | null;
  categoria: string; // nombre en español
  forma: FormaId;
};

export type PiezaVista = {
  /** Lo que se guarda en la columna "pieza": "rb:3034" o el código antiguo ("fina-rect-2x8"). */
  clave: string;
  /** Número de Rebrickable, si lo tiene. */
  partNum: string | null;
  nombre: string;
  medida: string | null;
  /** Categoría o tipo en español ("Rectangulares", "Rampas"…). */
  categoria: string | null;
  forma: FormaId;
  foto: string | null;
  dibujo: Dibujo | null;
};

export const PREFIJO_RB = "rb:";

export function vistaDesdeRb(r: DatosRb): PiezaVista {
  return {
    clave: PREFIJO_RB + r.part_num,
    partNum: r.part_num,
    nombre: r.nombre_en,
    medida: r.medida,
    categoria: r.categoria,
    forma: r.forma,
    foto: r.foto,
    dibujo: null,
  };
}

export function vistaDesdeAntigua(codigo: string): PiezaVista | undefined {
  const p = buscarPieza(codigo);
  if (!p) return undefined;
  const subtipo = FORMAS.find((f) => f.id === p.forma)?.subtipos.find((s) => s.id === p.subtipo);
  return {
    clave: p.id,
    partNum: null,
    nombre: p.nombre,
    medida: p.medida,
    categoria: subtipo?.nombre ?? null,
    forma: p.forma,
    foto: null,
    dibujo: p.dibujo,
  };
}

/** Vista de una fila guardada: con foto si está enlazada con Rebrickable, si no con su dibujo. */
export function vistaDeFila(f: { pieza: string; rb: DatosRb | null }): PiezaVista | undefined {
  return f.rb ? vistaDesdeRb(f.rb) : vistaDesdeAntigua(f.pieza);
}
