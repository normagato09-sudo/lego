"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_PHOTO_BYTES, removePieceImage, uploadPieceImage } from "@/lib/piece-images";
import { designHref } from "@/lib/piece-display";
import { friendlyDbError } from "./db-errors";

export type PieceFieldErrors = Partial<
  Record<"lego_id" | "color_id" | "quantity" | "photo", string>
>;

export type PieceFormState = {
  error?: string;
  fieldErrors?: PieceFieldErrors;
  /** Si ya existe la misma pieza en ese color: su ID de diseño, para enlazar su página. */
  existingLegoId?: string;
};

const DUPLICATE_MESSAGE = "Ya tienes esta pieza en este color. Edita su cantidad.";

/**
 * Busca la pieza que ya ocupa esa combinación lego_id + color + ubicación
 * (la que hace saltar la restricción única). Devuelve null si no la encuentra.
 */
async function findExistingPieceId(
  supabase: ReturnType<typeof createAdminClient>,
  legoId: string,
  colorId: number,
  locationId: string | null,
): Promise<string | null> {
  let query = supabase.from("pieces").select("id").eq("lego_id", legoId).eq("color_id", colorId);
  query = locationId ? query.eq("location_id", locationId) : query.is("location_id", null);
  const { data } = await query.limit(1).maybeSingle();
  return data?.id ?? null;
}

type ParsedPiece = {
  legoId: string;
  elementId: string | null;
  colorId: number;
  quantity: number;
  photo: File | null;
  removePhoto: boolean;
  fieldErrors: PieceFieldErrors;
};

function parsePieceForm(formData: FormData): ParsedPiece {
  const legoId = String(formData.get("lego_id") ?? "").trim();
  const elementId = String(formData.get("element_id") ?? "").trim();
  const colorRaw = String(formData.get("color_id") ?? "").trim();
  // Ids de Rebrickable: el 0 es Black, así que no vale comprobar con !colorId.
  const colorId = Number(colorRaw);
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const quantity = Number(quantityRaw);
  const photoRaw = formData.get("photo");
  const photo = photoRaw instanceof File && photoRaw.size > 0 ? photoRaw : null;

  const fieldErrors: PieceFieldErrors = {};
  if (!legoId) fieldErrors.lego_id = "El ID de diseño es obligatorio.";
  if (colorRaw === "" || !Number.isInteger(colorId)) fieldErrors.color_id = "Elige un color.";
  if (quantityRaw === "" || !Number.isInteger(quantity) || quantity < 0) {
    fieldErrors.quantity = "La cantidad debe ser un número entero igual o mayor que 0.";
  }
  if (photo && !photo.type.startsWith("image/")) {
    fieldErrors.photo = "El archivo debe ser una imagen.";
  } else if (photo && photo.size > MAX_PHOTO_BYTES) {
    fieldErrors.photo = "La foto no puede superar los 4 MB.";
  }

  return {
    legoId,
    elementId: elementId === "" ? null : elementId,
    colorId,
    quantity,
    photo,
    removePhoto: formData.get("remove_photo") === "1",
    fieldErrors,
  };
}

export async function createPiece(
  _prevState: PieceFormState,
  formData: FormData,
): Promise<PieceFormState> {
  const parsed = parsePieceForm(formData);
  if (Object.keys(parsed.fieldErrors).length > 0) {
    return { fieldErrors: parsed.fieldErrors };
  }

  const supabase = createAdminClient();

  let imageUrl: string | null = null;
  if (parsed.photo) {
    try {
      imageUrl = await uploadPieceImage(supabase, parsed.photo);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  // Nombre, descripción y ubicación ya no se piden en el formulario: quedan a null.
  const { error } = await supabase.from("pieces").insert({
    lego_id: parsed.legoId,
    element_id: parsed.elementId,
    color_id: parsed.colorId,
    quantity: parsed.quantity,
    image_url: imageUrl,
  });

  if (error) {
    await removePieceImage(supabase, imageUrl);
    if (error.code === "23505") {
      const existingPieceId = await findExistingPieceId(supabase, parsed.legoId, parsed.colorId, null);
      return { error: DUPLICATE_MESSAGE, existingLegoId: existingPieceId ? parsed.legoId : undefined };
    }
    return { error: friendlyDbError(error) };
  }

  revalidatePath("/piezas", "layout");
  redirect(designHref(parsed.legoId));
}

export async function updatePiece(
  id: string,
  _prevState: PieceFormState,
  formData: FormData,
): Promise<PieceFormState> {
  const parsed = parsePieceForm(formData);
  if (Object.keys(parsed.fieldErrors).length > 0) {
    return { fieldErrors: parsed.fieldErrors };
  }

  const supabase = createAdminClient();

  const { data: current, error: currentError } = await supabase
    .from("pieces")
    .select("image_url, location_id")
    .eq("id", id)
    .maybeSingle();
  if (currentError) {
    return { error: friendlyDbError(currentError) };
  }
  const oldImageUrl: string | null = current?.image_url ?? null;

  // undefined = no tocar la foto actual.
  let newImageUrl: string | null | undefined;
  if (parsed.photo) {
    try {
      newImageUrl = await uploadPieceImage(supabase, parsed.photo);
    } catch (e) {
      return { error: (e as Error).message };
    }
  } else if (parsed.removePhoto) {
    newImageUrl = null;
  }

  // Nombre, descripción y ubicación no se envían: se conservan los que ya tenga.
  const { error } = await supabase
    .from("pieces")
    .update({
      lego_id: parsed.legoId,
      element_id: parsed.elementId,
      color_id: parsed.colorId,
      quantity: parsed.quantity,
      ...(newImageUrl !== undefined && { image_url: newImageUrl }),
    })
    .eq("id", id);

  if (error) {
    if (newImageUrl) await removePieceImage(supabase, newImageUrl);
    if (error.code === "23505") {
      const existingPieceId = await findExistingPieceId(
        supabase,
        parsed.legoId,
        parsed.colorId,
        current?.location_id ?? null,
      );
      return { error: DUPLICATE_MESSAGE, existingLegoId: existingPieceId ? parsed.legoId : undefined };
    }
    return { error: friendlyDbError(error) };
  }

  if (newImageUrl !== undefined && oldImageUrl !== newImageUrl) {
    await removePieceImage(supabase, oldImageUrl);
  }

  revalidatePath("/piezas", "layout");
  redirect(designHref(parsed.legoId));
}

export async function deletePiece(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Dónde quedarse si el borrado falla (la página del diseño desde la que se borra).
  const redirectOnError = String(formData.get("redirect_on_error") ?? "/piezas");

  const supabase = createAdminClient();
  const { data: deleted, error } = await supabase
    .from("pieces")
    .delete()
    .eq("id", id)
    .select("image_url, lego_id")
    .maybeSingle();

  if (error) {
    console.error("Error al eliminar la pieza:", error.message);
    redirect(`${redirectOnError}?deleteError=${encodeURIComponent(friendlyDbError(error))}`);
  }

  await removePieceImage(supabase, deleted?.image_url ?? null);

  revalidatePath("/piezas", "layout");

  // Si quedan más colores de ese diseño se vuelve a su página; si era el último, al listado.
  if (deleted) {
    const { count } = await supabase
      .from("pieces")
      .select("id", { count: "exact", head: true })
      .eq("lego_id", deleted.lego_id);
    if (count) redirect(designHref(deleted.lego_id));
  }
  redirect("/piezas");
}

export type QuantityState = { error?: string };

export async function updateQuantity(
  id: string,
  _prevState: QuantityState,
  formData: FormData,
): Promise<QuantityState> {
  const raw = String(formData.get("quantity") ?? "").trim();
  const quantity = Number(raw);

  if (raw === "" || !Number.isInteger(quantity) || quantity < 0) {
    return { error: "La cantidad debe ser un número entero igual o mayor que 0." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("pieces").update({ quantity }).eq("id", id);

  if (error) {
    return { error: friendlyDbError(error) };
  }

  revalidatePath("/piezas", "layout");
  return {};
}
