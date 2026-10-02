"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Color, Piece } from "@/lib/types";
import type { PieceFormState } from "../actions";
import {
  findExistingPiece,
  getCatalogPart,
  type CatalogPartInfo,
  type ExistingPiece,
  type PartColor,
} from "../catalog-actions";
import { designHref } from "@/lib/piece-display";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PiecePhotoField } from "./PiecePhotoField";
import { LegoIdField } from "./LegoIdField";
import { ColorPicker } from "./ColorPicker";

type DefaultValues = Partial<
  Pick<Piece, "lego_id" | "element_id" | "color_id" | "quantity" | "image_url">
>;

type Props = {
  action: (prevState: PieceFormState, formData: FormData) => Promise<PieceFormState>;
  colors: Color[];
  defaultValues?: DefaultValues;
  /** Al editar: la pieza que se edita, para no avisar de que "ya la tienes". */
  pieceId?: string;
  submitLabel: string;
};

const CATALOG_DEBOUNCE_MS = 400;

function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} variant="primary">
      {pending ? "Guardando..." : label}
    </Button>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
      {error && <span className="text-xs text-red-status">{error}</span>}
    </label>
  );
}

export function PieceForm({ action, colors, defaultValues, pieceId, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, {} as PieceFormState);
  const [legoId, setLegoId] = useState(defaultValues?.lego_id ?? "");
  const [colorId, setColorId] = useState<number | null>(defaultValues?.color_id ?? null);
  // null = no lo ha escrito nadie: se rellena con el element ID del color elegido.
  const [typedElementId, setTypedElementId] = useState<string | null>(
    defaultValues?.element_id ?? null,
  );
  const [catalog, setCatalog] = useState<{ legoId: string; info: CatalogPartInfo } | null>(null);
  const [catalogError, setCatalogError] = useState<{ legoId: string; message: string } | null>(
    null,
  );
  const [existing, setExisting] = useState<{ key: string; piece: ExistingPiece | null } | null>(
    null,
  );

  const trimmed = legoId.trim();

  // Pieza y colores del catálogo cuando se deja de escribir el ID de diseño.
  useEffect(() => {
    if (!trimmed) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getCatalogPart(trimmed)
        .then((info) => {
          if (cancelled) return;
          setCatalogError(null);
          setCatalog({ legoId: trimmed, info });
        })
        .catch((e: Error) => !cancelled && setCatalogError({ legoId: trimmed, message: e.message }));
    }, CATALOG_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  const info = trimmed && catalog?.legoId === trimmed ? catalog.info : null;
  const inCatalog = !!info && info.colors.length > 0;
  const options: PartColor[] = !info
    ? []
    : inCatalog
      ? info.colors
      : colors.map((color) => ({ color, img_url: null, element_id: null }));
  // Si el color elegido no existe para esta pieza, cuenta como no elegido.
  const selected = options.find((o) => o.color.id === colorId) ?? null;
  const elementId = typedElementId ?? selected?.element_id ?? "";

  let status: "empty" | "loading" | "error" | "ready" = "ready";
  if (!trimmed) status = "empty";
  else if (!info) status = catalogError?.legoId === trimmed ? "error" : "loading";

  // En cuanto se elige un color: ¿ya está esa pieza en ese color en el inventario?
  const selectedColorId = selected?.color.id ?? null;
  const existingKey = selectedColorId === null ? null : `${trimmed}|${selectedColorId}`;
  useEffect(() => {
    if (existingKey === null || selectedColorId === null) return;
    let cancelled = false;
    findExistingPiece(trimmed, selectedColorId, pieceId)
      .then((piece) => !cancelled && setExisting({ key: existingKey, piece }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [existingKey, trimmed, selectedColorId, pieceId]);
  const existingPiece = existing && existing.key === existingKey ? existing.piece : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <ErrorBanner message={state.error}>
          {state.existingLegoId && (
            <Link href={designHref(state.existingLegoId)} className="font-medium underline">
              Ir a la pieza existente
            </Link>
          )}
        </ErrorBanner>
      )}

      <PiecePhotoField
        initialUrl={defaultValues?.image_url ?? null}
        error={state.fieldErrors?.photo}
      />

      <LegoIdField
        value={legoId}
        onChange={setLegoId}
        part={info?.part ?? null}
        error={state.fieldErrors?.lego_id}
      />

      <div className="flex flex-col gap-2">
        <ColorPicker
          status={status}
          options={options}
          inCatalog={inCatalog}
          selected={selected}
          onSelect={setColorId}
          legoId={trimmed}
          error={status === "error" ? catalogError?.message : state.fieldErrors?.color_id}
        />
        {existingPiece && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber bg-amber-tint px-3 py-2 text-sm text-ink"
          >
            <span>
              {existingPiece.quantity > 0
                ? `Ya tienes ${existingPiece.quantity}`
                : "Ya la tienes en tu inventario (0)"}
            </span>
            <Link href={designHref(trimmed)} className="font-medium underline">
              Ir a la pieza
            </Link>
          </div>
        )}
      </div>

      <Field label="ID de pieza (Element ID, opcional)">
        <input
          name="element_id"
          value={elementId}
          onChange={(e) => setTypedElementId(e.target.value)}
          className="input"
          placeholder="p. ej. 300121"
        />
      </Field>

      <Field label="Cantidad" error={state.fieldErrors?.quantity}>
        <input
          name="quantity"
          type="number"
          min={0}
          step={1}
          defaultValue={defaultValues?.quantity ?? 0}
          required
          className="input"
        />
      </Field>

      <div className="pt-2">
        <SubmitButton label={submitLabel} disabled={!!existingPiece} />
      </div>
    </form>
  );
}
