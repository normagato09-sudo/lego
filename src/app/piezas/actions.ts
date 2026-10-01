"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_PHOTO_BYTES, removePieceImage, uploadPieceImage } from "@/lib/piece-images";
import { friendlyDbError } from "./db-errors";

export type PieceFieldErrors = Partial<
  Record<"lego_id" | "name" | "color_id" | "quantity" | "photo", string>
>;

export type PieceFormState = {
  error?: string;
  fieldErrors?: PieceFieldErrors;
};

type ParsedPiece = {
  legoId: string;
  elementId: string | null;
  name: string;
  description: string | null;
  colorId: string;
  locationId: string | null;
  quantity: number;
  photo: File | null;
  removePhoto: boolean;
  fieldErrors: PieceFieldErrors;
};

function parsePieceForm(formData: FormData): ParsedPiece {
  const legoId = String(formData.get("lego_id") ?? "").trim();
  const elementId = String(formData.get("element_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const colorId = String(formData.get("color_id") ?? "").trim();
  const locationIdRaw = String(formData.get("location_id") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const quantity = Number(quantityRaw);
  const photoRaw = formData.get("photo");
  const photo = photoRaw instanceof File && photoRaw.size > 0 ? photoRaw : null;

  const fieldErrors: PieceFieldErrors = {};
  if (!legoId) fieldErrors.lego_id = "El ID de diseño es obligatorio.";
  if (!name) fieldErrors.name = "El nombre es obligatorio.";
  if (!colorId) fieldErrors.color_id = "Elige un color.";
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
    name,
    description: description === "" ? null : description,
    colorId,
    locationId: locationIdRaw === "" ? null : locationIdRaw,
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

  const { data, error } = await supabase
    .from("pieces")
    .insert({
      lego_id: parsed.legoId,
      element_id: parsed.elementId,
      name: parsed.name,
      description: parsed.description,
      color_id: parsed.colorId,
      location_id: parsed.locationId,
      quantity: parsed.quantity,
      image_url: imageUrl,
    })
    .select("id")
    .single();

  if (error) {
    await removePieceImage(supabase, imageUrl);
    return { error: friendlyDbError(error) };
  }

  revalidatePath("/piezas");
  redirect(`/piezas/${data.id}`);
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
    .select("image_url")
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

  const { error } = await supabase
    .from("pieces")
    .update({
      lego_id: parsed.legoId,
      element_id: parsed.elementId,
      name: parsed.name,
      description: parsed.description,
      color_id: parsed.colorId,
      location_id: parsed.locationId,
      quantity: parsed.quantity,
      ...(newImageUrl !== undefined && { image_url: newImageUrl }),
    })
    .eq("id", id);

  if (error) {
    if (newImageUrl) await removePieceImage(supabase, newImageUrl);
    return { error: friendlyDbError(error) };
  }

  if (newImageUrl !== undefined && oldImageUrl !== newImageUrl) {
    await removePieceImage(supabase, oldImageUrl);
  }

  revalidatePath("/piezas");
  revalidatePath(`/piezas/${id}`);
  redirect(`/piezas/${id}`);
}

export async function deletePiece(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Dónde quedarse si el borrado falla: el detalle si se borra desde ahí,
  // o el listado si se borra desde una PieceCard. Sin esto, el usuario
  // borrando desde /piezas acababa en /piezas/[id] sin explicación.
  const redirectOnError = String(formData.get("redirect_on_error") ?? "/piezas");

  const supabase = createAdminClient();
  const { data: deleted, error } = await supabase
    .from("pieces")
    .delete()
    .eq("id", id)
    .select("image_url")
    .maybeSingle();

  if (error) {
    console.error("Error al eliminar la pieza:", error.message);
    redirect(`${redirectOnError}?deleteError=${encodeURIComponent(friendlyDbError(error))}`);
  }

  await removePieceImage(supabase, deleted?.image_url ?? null);

  revalidatePath("/piezas");
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

  revalidatePath("/piezas");
  revalidatePath(`/piezas/${id}`);
  return {};
}
