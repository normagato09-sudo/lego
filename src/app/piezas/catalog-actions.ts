"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Color } from "@/lib/types";

/** Un color en el que existe una pieza, con su foto oficial de Rebrickable. */
export type PartColor = {
  color: Color;
  img_url: string | null;
};

type PartColorRow = {
  img_url: string | null;
  color: { id: number; name: string; rgb: string; is_trans: boolean } | null;
};

/**
 * Colores del catálogo en los que existe la pieza `legoId`. Se busca primero
 * como part_num de Rebrickable y, si no hay nada, como ID de diseño de LEGO
 * (que a veces es distinto). Devuelve [] si la pieza no está en el catálogo.
 */
export async function getPartColors(legoId: string): Promise<PartColor[]> {
  const id = legoId.trim();
  if (!id) return [];

  const supabase = createAdminClient();

  const fetchColors = async (partNum: string) => {
    const { data, error } = await supabase
      .from("catalog_part_colors")
      .select("img_url, color:catalog_colors(id, name, rgb, is_trans)")
      .eq("part_num", partNum);
    if (error) throw new Error(`No se pudieron cargar los colores de la pieza: ${error.message}`);
    return (data ?? []) as unknown as PartColorRow[];
  };

  let rows = await fetchColors(id);
  if (rows.length === 0) {
    const { data } = await supabase
      .from("catalog_elements")
      .select("part_num")
      .eq("design_id", id)
      .limit(1)
      .maybeSingle();
    if (data?.part_num && data.part_num !== id) rows = await fetchColors(data.part_num);
  }

  return rows
    .filter((r) => r.color && !r.color.name.startsWith("["))
    .map((r) => ({
      color: {
        id: r.color!.id,
        name: r.color!.name,
        hex_code: `#${r.color!.rgb}`,
        is_trans: r.color!.is_trans,
      },
      img_url: r.img_url,
    }))
    // Opacos primero y transparentes al final, cada grupo por nombre.
    .sort(
      (a, b) =>
        Number(a.color.is_trans) - Number(b.color.is_trans) ||
        a.color.name.localeCompare(b.color.name, "es"),
    );
}
