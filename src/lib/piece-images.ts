import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fotos de piezas en Supabase Storage (bucket `piece-images`, ver
 * supabase/migrations). Solo servidor: se usa con el cliente admin.
 */
const BUCKET = "piece-images";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

/** Igual que el file_size_limit del bucket. */
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

/** Sube la foto y devuelve su URL pública. */
export async function uploadPieceImage(supabase: SupabaseClient, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) {
    throw new Error(`No se pudo subir la foto: ${error.message}`);
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Borra la foto del storage si la URL pertenece al bucket. Un fallo solo se
 * registra: la pieza ya se ha guardado y no debe fallar por una foto huérfana.
 */
export async function removePieceImage(supabase: SupabaseClient, url: string | null) {
  if (!url) return;
  const idx = url.indexOf(PUBLIC_PREFIX);
  if (idx === -1) return;
  const path = decodeURIComponent(url.slice(idx + PUBLIC_PREFIX.length));
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error("Error al borrar la foto:", error.message);
  }
}
