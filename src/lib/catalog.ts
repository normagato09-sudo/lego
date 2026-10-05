import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Catálogo de Rebrickable en el servidor. Solo servidor: usa el cliente admin.
 */

type Supabase = ReturnType<typeof createAdminClient>;

async function partExists(supabase: Supabase, partNum: string): Promise<boolean> {
  const { data } = await supabase
    .from("catalog_parts")
    .select("part_num")
    .eq("part_num", partNum)
    .maybeSingle();
  return !!data;
}

/** Piezas distintas (part_num) que tienen ese ID de diseño de LEGO. */
export async function partNumsForDesignId(designId: string): Promise<string[]> {
  const { data } = await createAdminClient()
    .from("catalog_elements")
    .select("part_num")
    .eq("design_id", designId.trim())
    .limit(1000);
  return [...new Set((data ?? []).map((e) => e.part_num as string))];
}

/**
 * Pieza de Rebrickable (part_num) que corresponde a lo escrito. Por orden:
 * 0. La que se eligió en las sugerencias (si existe en el catálogo).
 * 1. Element ID exacto, si es de ese ID de diseño (o de ese part_num).
 * 2. El ID escrito ya es un part_num.
 * 3. El design_id corresponde a una sola pieza.
 * null = no está en el catálogo o es ambiguo (hay que elegir de las sugerencias).
 *
 * Misma regla que supabase/fixes/20261004_rellenar_part_num.sql.
 */
export async function resolvePartNum(
  legoId: string,
  elementId?: string | null,
  chosenPartNum?: string | null,
): Promise<string | null> {
  const id = legoId.trim();
  const element = elementId?.trim();
  const supabase = createAdminClient();

  if (chosenPartNum && (await partExists(supabase, chosenPartNum))) return chosenPartNum;
  if (!id) return null;

  if (element) {
    const { data } = await supabase
      .from("catalog_elements")
      .select("part_num, design_id")
      .eq("element_id", element)
      .maybeSingle();
    if (data && (data.design_id === id || data.part_num === id)) return data.part_num;
  }

  if (await partExists(supabase, id)) return id;

  const partNums = await partNumsForDesignId(id);
  return partNums.length === 1 ? partNums[0] : null;
}

/** Valor entre comillas para un filtro .or() de PostgREST. */
export function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Filtro .or() de las piezas de un diseño: las de esa pieza del catálogo o, si
 * no está en el catálogo, las de ese ID escrito sin part_num.
 */
export function designFilter(key: string): string {
  return `part_num.eq.${quote(key)},and(part_num.is.null,lego_id.eq.${quote(key)})`;
}

export type SamePiece = { id: string; designKey: string; quantity: number };

/**
 * ¿Ya hay esa pieza en ese color? Con part_num compara pieza del catálogo +
 * color (28653 y 3023 son la misma); sin él, el ID escrito + color. Devuelve
 * una de las filas y la cantidad total, o null.
 */
export async function findSamePiece(args: {
  partNum: string | null;
  legoId: string;
  colorId: number;
  excludeId?: string;
}): Promise<SamePiece | null> {
  const key = args.partNum ?? args.legoId.trim();
  let query = createAdminClient()
    .from("pieces")
    .select("id, quantity")
    .or(designFilter(key))
    .eq("color_id", args.colorId);
  if (args.excludeId) query = query.neq("id", args.excludeId);
  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;
  return {
    id: data[0].id,
    designKey: key,
    quantity: data.reduce((sum, p) => sum + p.quantity, 0),
  };
}
