"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { friendlyDbError } from "./db-errors";

export type PieceFieldErrors = Partial<
  Record<"lego_id" | "name" | "color_id" | "quantity", string>
>;

export type PieceFormState = {
  error?: string;
  fieldErrors?: PieceFieldErrors;
};

type ParsedPiece = {
  legoId: string;
  name: string;
  description: string | null;
  colorId: string;
  locationId: string | null;
  quantity: number;
  fieldErrors: PieceFieldErrors;
};

function parsePieceForm(formData: FormData): ParsedPiece {
  const legoId = String(formData.get("lego_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const colorId = String(formData.get("color_id") ?? "").trim();
  const locationIdRaw = String(formData.get("location_id") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const quantity = Number(quantityRaw);

  const fieldErrors: PieceFieldErrors = {};
  if (!legoId) fieldErrors.lego_id = "El ID de LEGO es obligatorio.";
  if (!name) fieldErrors.name = "El nombre es obligatorio.";
  if (!colorId) fieldErrors.color_id = "Elige un color.";
  if (quantityRaw === "" || !Number.isInteger(quantity) || quantity < 0) {
    fieldErrors.quantity = "La cantidad debe ser un número entero igual o mayor que 0.";
  }

  return {
    legoId,
    name,
    description: description === "" ? null : description,
    colorId,
    locationId: locationIdRaw === "" ? null : locationIdRaw,
    quantity,
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
  const { data, error } = await supabase
    .from("pieces")
    .insert({
      lego_id: parsed.legoId,
      name: parsed.name,
      description: parsed.description,
      color_id: parsed.colorId,
      location_id: parsed.locationId,
      quantity: parsed.quantity,
    })
    .select("id")
    .single();

  if (error) {
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
  const { error } = await supabase
    .from("pieces")
    .update({
      lego_id: parsed.legoId,
      name: parsed.name,
      description: parsed.description,
      color_id: parsed.colorId,
      location_id: parsed.locationId,
      quantity: parsed.quantity,
    })
    .eq("id", id);

  if (error) {
    return { error: friendlyDbError(error) };
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
  const { error } = await supabase.from("pieces").delete().eq("id", id);

  if (error) {
    console.error("Error al eliminar la pieza:", error.message);
    redirect(`${redirectOnError}?deleteError=${encodeURIComponent(friendlyDbError(error))}`);
  }

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
