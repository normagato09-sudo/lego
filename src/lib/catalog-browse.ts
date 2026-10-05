import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { partNumsForDesignId, quote } from "@/lib/catalog";

/**
 * Catálogo para explorar (/catalogo): solo piezas normales y de Technic, con
 * foto, sin estampados y sin las que ya están en el inventario. Solo servidor.
 */

export const CATALOG_PAGE_SIZE = 48;

export type CatalogCategory = { id: number; name: string };

export type CatalogListPart = {
  part_num: string;
  name: string;
  img_url: string | null;
  part_cat_id: number;
};

export type CatalogPage = {
  parts: CatalogListPart[];
  /** Total con estos filtros; solo en la primera página (offset 0). */
  total: number | null;
  hasMore: boolean;
};

type Supabase = ReturnType<typeof createAdminClient>;

/** Ladrillos, placas y baldosas (con pendientes y curvas) y todo Technic. */
const CATEGORY_RE = /^(Bricks|Plates|Tiles|Technic)\b/;

export const getCatalogCategories = cache(async (): Promise<CatalogCategory[]> => {
  const { data, error } = await createAdminClient()
    .from("catalog_part_categories")
    .select("id, name")
    .order("name");
  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  return (data ?? []).filter((c) => CATEGORY_RE.test(c.name));
});

/** part_num de las piezas del inventario (de 1000 en 1000: límite de PostgREST). */
async function ownedPartNums(supabase: Supabase): Promise<string[]> {
  const owned = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("pieces")
      .select("part_num")
      .not("part_num", "is", null)
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(`No se pudo cargar el inventario: ${error.message}`);
    for (const row of data ?? []) owned.add(row.part_num as string);
    if (!data || data.length < 1000) return [...owned];
  }
}

/** Escapa los comodines de ILIKE (\, % y _). */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function getCatalogPage(args: {
  q: string;
  categoryId: number | null;
  offset: number;
}): Promise<CatalogPage> {
  const supabase = createAdminClient();
  const term = args.q.trim();
  const offset = Math.max(0, Math.floor(args.offset));
  const [categories, owned, byDesign] = await Promise.all([
    getCatalogCategories(),
    ownedPartNums(supabase),
    term ? partNumsForDesignId(term) : Promise.resolve([]),
  ]);
  const categoryIds =
    args.categoryId !== null && categories.some((c) => c.id === args.categoryId)
      ? [args.categoryId]
      : categories.map((c) => c.id);

  let query = supabase
    .from("catalog_parts")
    .select("part_num, name, img_url, part_cat_id", { count: offset === 0 ? "exact" : undefined })
    .in("part_cat_id", categoryIds)
    .not("img_url", "is", null)
    // Sin variantes estampadas, impresas ni con pegatinas.
    .not("part_num", "ilike", "%pr%")
    .not("part_num", "ilike", "%pat%")
    .not("name", "ilike", "%print%")
    .not("name", "ilike", "%pattern%")
    .not("name", "ilike", "%sticker%");
  if (owned.length > 0) {
    const ownedList: string = `(${owned.map(quote).join(",")})`;
    query = query.filter("part_num", "not.in", ownedList);
  }
  if (term) {
    const like = escapeLike(term);
    const filters = [`part_num.ilike.${quote(`${like}%`)}`, `name.ilike.${quote(`%${like}%`)}`];
    if (byDesign.length > 0) filters.push(`part_num.in.(${byDesign.map(quote).join(",")})`);
    query = query.or(filters.join(","));
  }

  const { data, count, error } = await query
    .order("name")
    .order("part_num")
    .range(offset, offset + CATALOG_PAGE_SIZE - 1);
  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);

  const parts = (data ?? []) as CatalogListPart[];
  return {
    parts,
    total: offset === 0 ? (count ?? null) : null,
    hasMore: parts.length === CATALOG_PAGE_SIZE,
  };
}
