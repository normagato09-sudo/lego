import type { DatosRb } from "@/lib/vista";

// Agrupar piezas parecidas (criterio "d"):
// el tipo de una pieza es su nombre de Rebrickable
//  - sin lo que va entre [corchetes] o (paréntesis),
//  - sin la posición final ("on Side", "on End", "on Top"…),
//  - y con "Clips", "Handles"… en singular.
// Ej.: "Plate Special 1 x 2 with Clip Horizontal on Side" y
//      "Plate Special 1 x 2 with Clips Horizontal [Open O Clips]"
//      → "Plate Special 1 x 2 with Clip Horizontal".

/** Nombre del tipo de una pieza a partir de su nombre de Rebrickable. */
export function nombreDeTipo(nombre: string): string {
  return nombre
    .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")
    .replace(/\s+(on|at)\s+(side|sides|end|ends|top|bottom|one end|both ends|corner)\b.*$/i, "")
    .replace(/\b(Clips|Handles|Bars|Studs|Holes|Towballs)\b/g, (p) => p.slice(0, -1))
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clave del grupo de una fila. Las piezas de Rebrickable se agrupan por forma + tipo;
 * las antiguas (sin enlazar) van cada una en su propio grupo.
 */
export function claveDeGrupo(f: { pieza: string; rb: DatosRb | null }): string {
  return f.rb ? `rb:${f.rb.forma}:${nombreDeTipo(f.rb.nombre_en)}` : `antigua:${f.pieza}`;
}

/** Identificador de la variante: el número de pieza (o el código antiguo). */
export function claveDeVariante(f: { pieza: string; rb: DatosRb | null }): string {
  return f.rb?.part_num ?? f.pieza;
}
