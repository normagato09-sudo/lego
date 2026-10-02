"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { findSamePiece, partNumsForDesignId, resolvePartNum, type SamePiece } from "@/lib/catalog";
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
  /** Nº de piezas con ese design_id cuando es ambiguo (más de una); 0 si no. */
  ambiguousCount: number;
};

type PartColorRow = {
  img_url: string | null;
  element_id: string | null;
  color: { id: number; name: string; rgb: string; is_trans: boolean } | null;
};

/**
 * La pieza del catálogo que corresponde a lo escrito (regla de resolvePartNum)
 * y los colores en los que existe. Si no está o es ambigua: part null.
 */
export async function getCatalogPart(
  legoId: string,
  elementId?: string | null,
  chosenPartNum?: string | null,
): Promise<CatalogPartInfo> {
  const id = legoId.trim();
  if (!id && !chosenPartNum) return { part: null, colors: [], ambiguousCount: 0 };

  const partNum = await resolvePartNum(id, elementId, chosenPartNum);
  if (!partNum) {
    const candidates = id ? await partNumsForDesignId(id) : [];
    return {
      part: null,
      colors: [],
      ambiguousCount: candidates.length > 1 ? candidates.length : 0,
    };
  }

  const supabase = createAdminClient();
  const [{ data: part, error: partError }, { data, error }] = await Promise.all([
    supabase.from("catalog_parts").select("part_num, name, img_url").eq("part_num", partNum).single(),
    supabase
      .from("catalog_part_colors")
      .select("img_url, element_id, color:catalog_colors(id, name, rgb, is_trans)")
      .eq("part_num", partNum),
  ]);
  if (partError) throw new Error(`No se pudo cargar la pieza del catálogo: ${partError.message}`);
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

  return { part: part as CatalogPart, colors, ambiguousCount: 0 };
}

/** Sugerencias del catálogo mientras se escribe el ID de diseño. */
export async function searchParts(q: string, maxResults = 8): Promise<CatalogPart[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const { data, error } = await createAdminClient().rpc("search_catalog_parts", {
    q: term,
    max_results: maxResults,
  });
  if (error) throw new Error(`No se pudo buscar en el catálogo: ${error.message}`);
  return (data ?? []) as CatalogPart[];
}

/** Element ID de LEGO (el de Pick a Brick): pieza, color e ID de diseño. */
export type ElementInfo = {
  element_id: string;
  part_num: string;
  design_id: string | null;
  color_id: number;
};

export async function lookupElement(elementId: string): Promise<ElementInfo | null> {
  const id = elementId.trim();
  if (!/^\d{4,}$/.test(id)) return null;
  const { data, error } = await createAdminClient()
    .from("catalog_elements")
    .select("element_id, part_num, design_id, color_id")
    .eq("element_id", id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo buscar el ID de elemento: ${error.message}`);
  return data as ElementInfo | null;
}

export type ExistingPiece = SamePiece;

/**
 * Si ya tienes esa pieza en ese color (sin contar la que se edita). Compara por
 * pieza del catálogo + color si se conoce; si no, por el ID escrito + color.
 */
export async function findExistingPiece(args: {
  partNum: string | null;
  legoId: string;
  colorId: number;
  excludeId?: string;
}): Promise<ExistingPiece | null> {
  return findSamePiece(args);
}
