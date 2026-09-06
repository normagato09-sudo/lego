import { createAdminClient } from "@/lib/supabase/admin";
import type { Color, Location, PieceWithDetails } from "@/lib/types";

export async function getColors(): Promise<Color[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("colors")
    .select("id, name, hex_code")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar los colores: ${error.message}`);
  }
  return data ?? [];
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

export async function getPieces(): Promise<PieceWithDetails[]> {
  const supabase = createAdminClient();
  const [{ data: pieces, error }, colors, locations] = await Promise.all([
    supabase.from("pieces").select("*").order("created_at", { ascending: false }),
    getColors(),
    getLocations(),
  ]);

  if (error) {
    throw new Error(`No se pudieron cargar las piezas: ${error.message}`);
  }

  const colorsById = new Map(colors.map((c) => [c.id, c]));
  return (pieces ?? []).map((piece) => ({
    ...piece,
    color: colorsById.get(piece.color_id) ?? { id: piece.color_id, name: "Desconocido", hex_code: null },
    locationLabel: locationLabel(piece.location_id, locations),
  }));
}

export async function getPieceById(id: string): Promise<PieceWithDetails | null> {
  const supabase = createAdminClient();
  const [{ data: piece, error }, colors, locations] = await Promise.all([
    supabase.from("pieces").select("*").eq("id", id).maybeSingle(),
    getColors(),
    getLocations(),
  ]);

  if (error) {
    throw new Error(`No se pudo cargar la pieza: ${error.message}`);
  }
  if (!piece) return null;

  const colorsById = new Map(colors.map((c) => [c.id, c]));
  return {
    ...piece,
    color: colorsById.get(piece.color_id) ?? { id: piece.color_id, name: "Desconocido", hex_code: null },
    locationLabel: locationLabel(piece.location_id, locations),
  };
}
