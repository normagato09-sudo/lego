"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Color, Location, Piece } from "@/lib/types";
import type { PieceFormState } from "../actions";
import { PiecePhotoField } from "./PiecePhotoField";

type DefaultValues = Pick<
  Piece,
  "lego_id" | "name" | "description" | "color_id" | "location_id" | "quantity" | "image_url"
>;

type Props = {
  action: (prevState: PieceFormState, formData: FormData) => Promise<PieceFormState>;
  colors: Color[];
  locations: Location[];
  defaultValues?: DefaultValues;
  submitLabel: string;
};

function groupLocations(locations: Location[]) {
  const topLevel = locations.filter((l) => !l.parent_id);
  return topLevel.map((box) => ({
    box,
    children: locations.filter((l) => l.parent_id === box.id),
  }));
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? "Guardando..." : label}
    </button>
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

export function PieceForm({ action, colors, locations, defaultValues, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, {} as PieceFormState);
  const grouped = groupLocations(locations);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <p className="rounded-md border border-red-status/30 bg-red-tint px-3 py-2 text-sm text-red-status">
          {state.error}
        </p>
      )}

      <PiecePhotoField initialUrl={defaultValues?.image_url ?? null} />

      <Field label="ID de LEGO" error={state.fieldErrors?.lego_id}>
        <input
          name="lego_id"
          defaultValue={defaultValues?.lego_id}
          required
          className="input"
          placeholder="p. ej. 3001"
        />
      </Field>

      <Field label="Nombre" error={state.fieldErrors?.name}>
        <input
          name="name"
          defaultValue={defaultValues?.name}
          required
          className="input"
          placeholder="p. ej. Brick 2x4"
        />
      </Field>

      <Field label="Descripción (opcional)">
        <textarea
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          rows={3}
          className="input"
        />
      </Field>

      <Field label="Color" error={state.fieldErrors?.color_id}>
        <select
          name="color_id"
          defaultValue={defaultValues?.color_id ?? ""}
          required
          className="input"
        >
          <option value="" disabled>
            Elige un color
          </option>
          {colors.map((color) => (
            <option key={color.id} value={color.id}>
              {color.name}
            </option>
          ))}
        </select>
        {colors.length === 0 && (
          <span className="text-xs text-amber">
            No hay colores en la base de datos todavía.
          </span>
        )}
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

      <Field label="Ubicación (opcional)">
        <select name="location_id" defaultValue={defaultValues?.location_id ?? ""} className="input">
          <option value="">Sin ubicación</option>
          {grouped.map(({ box, children }) =>
            children.length > 0 ? (
              <optgroup key={box.id} label={box.name}>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={box.id} value={box.id}>
                {box.name}
              </option>
            ),
          )}
        </select>
        {locations.length === 0 && (
          <span className="text-xs text-steel">Todavía no hay ubicaciones creadas.</span>
        )}
      </Field>

      <div className="pt-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
