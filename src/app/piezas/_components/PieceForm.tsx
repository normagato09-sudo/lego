"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Color, Piece } from "@/lib/types";
import type { PieceFormState } from "../actions";
import { designHref } from "@/lib/piece-display";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PiecePhotoField } from "./PiecePhotoField";
import { ColorPicker } from "./ColorPicker";

type DefaultValues = Partial<
  Pick<Piece, "lego_id" | "element_id" | "color_id" | "quantity" | "image_url">
>;

type Props = {
  action: (prevState: PieceFormState, formData: FormData) => Promise<PieceFormState>;
  colors: Color[];
  defaultValues?: DefaultValues;
  submitLabel: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="primary">
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

export function PieceForm({ action, colors, defaultValues, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, {} as PieceFormState);
  const [legoId, setLegoId] = useState(defaultValues?.lego_id ?? "");

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

      <Field label="ID de diseño" error={state.fieldErrors?.lego_id}>
        <input
          name="lego_id"
          value={legoId}
          onChange={(e) => setLegoId(e.target.value)}
          required
          className="input"
          placeholder="p. ej. 3001"
        />
      </Field>

      <Field label="ID de pieza (Element ID, opcional)">
        <input
          name="element_id"
          defaultValue={defaultValues?.element_id ?? ""}
          className="input"
          placeholder="p. ej. 300121"
        />
      </Field>

      <ColorPicker
        legoId={legoId}
        allColors={colors}
        defaultColorId={defaultValues?.color_id}
        error={state.fieldErrors?.color_id}
      />

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
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
