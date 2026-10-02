import { createAdminClient } from "@/lib/supabase/admin";
import type { Color, Location, Piece, PieceWithDetails } from "@/lib/types";

/** Colores oficiales de Rebrickable, sin los comodines "[Unknown]" y "[No Color/Any Color]". */
export async function getColors(): Promise<Color[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("catalog_colors")
    .select("id, name, rgb, is_trans")
    .not("name", "like", "[%")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar los colores: ${error.message}`);
  }
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    hex_code: `#${c.rgb}`,
    is_trans: c.is_trans,
  }));
}

export async function getLocations(): Promise<Location[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("locations")
    .select("id, name, parent_id")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar las ubicaciones: ${error.message}`);
  }
  return data ?? [];
}

/** Construye una etiqueta legible ("Caja 1 › Compartimento A") para una ubicación. */
export function locationLabel(
  locationId: string | null,
  locations: Location[],
): string | null {
  if (!locationId) return null;
  const byId = new Map(locations.map((l) => [l.id, l]));
  const location = byId.get(locationId);
  if (!location) return null;
  if (!location.parent_id) return location.name;
  const parent = byId.get(location.parent_id);
  return parent ? `${parent.name} › ${location.name}` : location.name;
}

/** Fila de la vista inventory_pieces: la pieza con los datos del catálogo. */
type InventoryRow = Piece & {
  catalog_name: string | null;
  part_img_url: string | null;
  color_img_url: string | null;
  color_name: string;
  color_rgb: string;
  color_is_trans: boolean;
};

function withDetails(row: InventoryRow, locations: Location[]): PieceWithDetails {
  const { color_name, color_rgb, color_is_trans, ...piece } = row;
  return {
    ...piece,
    color: { id: piece.color_id, name: color_name, hex_code: `#${color_rgb}`, is_trans: color_is_trans },
    locationLabel: locationLabel(piece.location_id, locations),
  };
}

export async function getPieces(): Promise<PieceWithDetails[]> {
  const supabase = createAdminClient();
  const [{ data: pieces, error }, locations] = await Promise.all([
    supabase.from("inventory_pieces").select("*").order("created_at", { ascending: false }),
    getLocations(),
  ]);

  if (error) {
    throw new Error(`No se pudieron cargar las piezas: ${error.message}`);
  }

  return ((pieces ?? []) as InventoryRow[]).map((row) => withDetails(row, locations));
}

/** Todas las variantes (colores) de un ID de diseño, ordenadas por nombre de color. */
export async function getPiecesByLegoId(legoId: string): Promise<PieceWithDetails[]> {
  const supabase = createAdminClient();
  const [{ data: pieces, error }, locations] = await Promise.all([
    supabase.from("inventory_pieces").select("*").eq("lego_id", legoId),
    getLocations(),
  ]);

  if (error) {
    throw new Error(`No se pudieron cargar las piezas: ${error.message}`);
  }

  return ((pieces ?? []) as InventoryRow[])
    .map((row) => withDetails(row, locations))
    .sort((a, b) => a.color.name.localeCompare(b.color.name, "es"));
}

export async function getPieceById(id: string): Promise<PieceWithDetails | null> {
  const supabase = createAdminClient();
  const [{ data: piece, error }, locations] = await Promise.all([
    supabase.from("inventory_pieces").select("*").eq("id", id).maybeSingle(),
    getLocations(),
  ]);

  if (error) {
    throw new Error(`No se pudo cargar la pieza: ${error.message}`);
  }
  if (!piece) return null;

  return withDetails(piece as InventoryRow, locations);
}
