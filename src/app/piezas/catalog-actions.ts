"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Color } from "@/lib/types";

/** Pieza del catálogo de Rebrickable, con su foto representativa. */
export type CatalogPart = {
  part_num: string;
  name: string;
  img_url: string | null;
};

/** Un color en el que existe una pieza, con su foto oficial y su element ID. */
export type PartColor = {
  color: Color;
  img_url: string | null;
  element_id: string | null;
};

export type CatalogPartInfo = {
  part: CatalogPart | null;
  colors: PartColor[];
};

type PartColorRow = {
  img_url: string | null;
  element_id: string | null;
  color: { id: number; name: string; rgb: string; is_trans: boolean } | null;
};

/**
 * La pieza `legoId` del catálogo y los colores en los que existe. Se busca
 * primero como part_num de Rebrickable y, si no está, como ID de diseño de
 * LEGO (que a veces es distinto). Si no está en el catálogo: part null y sin colores.
 */
export async function getCatalogPart(legoId: string): Promise<CatalogPartInfo> {
  const id = legoId.trim();
  if (!id) return { part: null, colors: [] };

  const supabase = createAdminClient();

  const fetchPart = async (partNum: string) => {
    const { data, error } = await supabase
      .from("catalog_parts")
      .select("part_num, name, img_url")
      .eq("part_num", partNum)
      .maybeSingle();
    if (error) throw new Error(`No se pudo cargar la pieza del catálogo: ${error.message}`);
    return data as CatalogPart | null;
  };

  let part = await fetchPart(id);
  if (!part) {
    const { data } = await supabase
      .from("catalog_elements")
      .select("part_num")
      .eq("design_id", id)
      .limit(1)
      .maybeSingle();
    if (data?.part_num) part = await fetchPart(data.part_num);
  }
  if (!part) return { part: null, colors: [] };

  const { data, error } = await supabase
    .from("catalog_part_colors")
    .select("img_url, element_id, color:catalog_colors(id, name, rgb, is_trans)")
    .eq("part_num", part.part_num);
  if (error) throw new Error(`No se pudieron cargar los colores de la pieza: ${error.message}`);

  const colors = ((data ?? []) as unknown as PartColorRow[])
    .filter((r) => r.color && !r.color.name.startsWith("["))
    .map((r) => ({
      color: {
        id: r.color!.id,
        name: r.color!.name,
        hex_code: `#${r.color!.rgb}`,
        is_trans: r.color!.is_trans,
      },
      img_url: r.img_url,
      element_id: r.element_id,
    }))
    // Opacos primero y transparentes al final, cada grupo por nombre.
    .sort(
      (a, b) =>
        Number(a.color.is_trans) - Number(b.color.is_trans) ||
        a.color.name.localeCompare(b.color.name, "es"),
    );

  return { part, colors };
}

/** Sugerencias del catálogo mientras se escribe el ID de diseño. */
export async function searchParts(q: string): Promise<CatalogPart[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const { data, error } = await createAdminClient().rpc("search_catalog_parts", {
    q: term,
    max_results: 8,
  });
  if (error) throw new Error(`No se pudo buscar en el catálogo: ${error.message}`);
  return (data ?? []) as CatalogPart[];
}

export type ExistingPiece = { id: string; quantity: number };

/**
 * Si ya tienes ese diseño en ese color (sin contar la pieza que se edita),
 * devuelve una de esas filas y la cantidad total; si no, null.
 */
export async function findExistingPiece(
  legoId: string,
  colorId: number,
  excludeId?: string,
): Promise<ExistingPiece | null> {
  let query = createAdminClient()
    .from("pieces")
    .select("id, quantity")
    .eq("lego_id", legoId.trim())
    .eq("color_id", colorId);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;
  return { id: data[0].id, quantity: data.reduce((sum, p) => sum + p.quantity, 0) };
}
