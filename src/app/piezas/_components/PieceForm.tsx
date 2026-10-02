"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Color, Piece } from "@/lib/types";
import type { PieceFormState } from "../actions";
import {
  findExistingPiece,
  getCatalogPart,
  lookupElement,
  type CatalogPart,
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
  Pick<Piece, "lego_id" | "part_num" | "element_id" | "color_id" | "quantity" | "image_url">
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
const ELEMENT_DEBOUNCE_MS = 400;

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
  // Pieza del catálogo elegida a mano (sugerencia o element ID); null = la decide resolvePartNum.
  const [partChoice, setPartChoice] = useState<string | null>(defaultValues?.part_num ?? null);
  const [colorId, setColorId] = useState<number | null>(defaultValues?.color_id ?? null);
  // null = no lo ha escrito nadie: se rellena con el element ID del color elegido.
  const [typedElementId, setTypedElementId] = useState<string | null>(
    defaultValues?.element_id ?? null,
  );
  const [elementLookup, setElementLookup] = useState<{ elementId: string; found: boolean } | null>(
    null,
  );
  const [catalog, setCatalog] = useState<{ key: string; info: CatalogPartInfo } | null>(null);
  const [catalogError, setCatalogError] = useState<{ key: string; message: string } | null>(null);
  const [existing, setExisting] = useState<{ key: string; piece: ExistingPiece | null } | null>(
    null,
  );
  const elementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestElement = useRef("");
  const quantityRef = useRef<HTMLInputElement>(null);

  const trimmed = legoId.trim();
  const typedElement = typedElementId?.trim() ?? "";
  const catalogKey = `${trimmed}|${typedElement}|${partChoice ?? ""}`;

  // Pieza y colores del catálogo cuando se deja de escribir.
  useEffect(() => {
    if (!trimmed) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getCatalogPart(trimmed, typedElement || null, partChoice)
        .then((info) => {
          if (cancelled) return;
          setCatalogError(null);
          setCatalog({ key: catalogKey, info });
        })
        .catch(
          (e: Error) => !cancelled && setCatalogError({ key: catalogKey, message: e.message }),
        );
    }, CATALOG_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [catalogKey, trimmed, typedElement, partChoice]);

  /**
   * Element ID de Pick a Brick: al dejar de escribir se rellenan solos el ID de
   * diseño, la pieza y el color, y el cursor pasa a la cantidad.
   */
  function handleElementChange(value: string) {
    setTypedElementId(value);
    const id = value.trim();
    latestElement.current = id;
    if (elementTimer.current) clearTimeout(elementTimer.current);
    if (id.length < 4) return;
    elementTimer.current = setTimeout(async () => {
      const found = await lookupElement(id).catch(() => null);
      if (latestElement.current !== id) return;
      setElementLookup({ elementId: id, found: !!found });
      if (!found) return;
      setLegoId(found.design_id ?? found.part_num);
      setPartChoice(found.part_num);
      setColorId(found.color_id);
      quantityRef.current?.focus();
    }, ELEMENT_DEBOUNCE_MS);
  }

  // Si se escribe a mano el ID de diseño, la pieza elegida antes deja de valer.
  function handleLegoIdChange(value: string) {
    setLegoId(value);
    setPartChoice(null);
  }

  const info = trimmed && catalog?.key === catalogKey ? catalog.info : null;

  // Sugerencia elegida: si lo escrito es un ID de diseño de varias piezas (o la
  // pieza ya se eligió), se conserva lo escrito y solo se fija la pieza; si es
  // un nombre ("brick 2 x 4"), se escribe su part_num.
  function handlePick(part: CatalogPart) {
    if (partChoice !== null || (info?.ambiguousCount ?? 0) > 0) setPartChoice(part.part_num);
    else setLegoId(part.part_num);
  }

  const inCatalog = !!info && info.colors.length > 0;
  const options: PartColor[] = !info
    ? []
    : inCatalog
      ? info.colors
      : colors.map((color) => ({ color, img_url: null, element_id: null }));
  // Si el color elegido no existe para esta pieza, cuenta como no elegido.
  const selected = options.find((o) => o.color.id === colorId) ?? null;
  const elementId = typedElementId ?? selected?.element_id ?? "";
  const partNum = info?.part?.part_num ?? null;

  let status: "empty" | "loading" | "error" | "ready" = "ready";
  if (!trimmed) status = "empty";
  else if (!info) status = catalogError?.key === catalogKey ? "error" : "loading";

  // En cuanto se elige un color: ¿ya está esa pieza (part_num) en ese color?
  const selectedColorId = selected?.color.id ?? null;
  const existingKey =
    selectedColorId === null || !info ? null : `${partNum ?? trimmed}|${selectedColorId}`;
  useEffect(() => {
    if (existingKey === null || selectedColorId === null) return;
    let cancelled = false;
    findExistingPiece({ partNum, legoId: trimmed, colorId: selectedColorId, excludeId: pieceId })
      .then((piece) => !cancelled && setExisting({ key: existingKey, piece }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [existingKey, partNum, trimmed, selectedColorId, pieceId]);
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

      <Field label="ID de elemento (Pick a Brick, opcional)">
        <input
          name="element_id"
          value={elementId}
          onChange={(e) => handleElementChange(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          className="input"
          placeholder="p. ej. 6514002 — rellena pieza y color"
        />
        {elementLookup && elementLookup.elementId === typedElement && !elementLookup.found && (
          <span className="text-xs text-amber">
            No encuentro ese ID de elemento en el catálogo: rellena la pieza a mano.
          </span>
        )}
      </Field>

      <LegoIdField
        value={legoId}
        onChange={handleLegoIdChange}
        onPick={handlePick}
        part={info?.part ?? null}
        ambiguousCount={info?.ambiguousCount ?? 0}
        error={state.fieldErrors?.lego_id}
      />
      <input type="hidden" name="part_num" value={partNum ?? ""} />

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
            <Link href={designHref(existingPiece.designKey)} className="font-medium underline">
              Ir a la pieza
            </Link>
          </div>
        )}
      </div>

      <Field label="Cantidad" error={state.fieldErrors?.quantity}>
        <input
          ref={quantityRef}
          name="quantity"
          type="number"
          inputMode="numeric"
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
