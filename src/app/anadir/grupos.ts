import type { FormaId } from "@/lib/catalogo";
import { CATEGORIAS_RB } from "@/lib/rebrickable/categorias";

export type Grupo = { nombre: string; ids: number[] };

/** Grupos de categorías de una forma (las que comparten nombre van juntas), en orden. */
export function gruposDeForma(forma: FormaId): Grupo[] {
  const grupos: Grupo[] = [];
  for (const c of [...CATEGORIAS_RB].filter((c) => c.forma === forma).sort((a, b) => a.orden - b.orden)) {
    const g = grupos.find((x) => x.nombre === c.nombre);
    if (g) g.ids.push(c.id);
    else grupos.push({ nombre: c.nombre, ids: [c.id] });
  }
  return grupos;
}

/** Grupo al que pertenece una categoría (por su nombre en español). */
export function grupoDeCategoria(forma: FormaId, nombreCategoria: string): Grupo | undefined {
  return gruposDeForma(forma).find((g) => g.nombre === nombreCategoria);
}
