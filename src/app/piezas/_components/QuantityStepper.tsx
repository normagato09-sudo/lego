"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateQuantity, type QuantityState } from "../actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </button>
  );
}

export function QuantityStepper({ id, quantity }: { id: string; quantity: number }) {
  const action = updateQuantity.bind(null, id);
  const [state, formAction] = useActionState(action, {} as QuantityState);
  const [value, setValue] = useState(quantity);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="btn h-9 w-9 p-0 text-base"
        onClick={() => setValue((v) => Math.max(0, v - 1))}
        aria-label="Restar una unidad"
      >
        −
      </button>
      <input
        type="number"
        name="quantity"
        min={0}
        step={1}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          setValue(Number.isFinite(next) ? Math.max(0, Math.trunc(next)) : 0);
        }}
        className="input w-24 text-center"
      />
      <button
        type="button"
        className="btn h-9 w-9 p-0 text-base"
        onClick={() => setValue((v) => v + 1)}
        aria-label="Sumar una unidad"
      >
        +
      </button>
      <SaveButton />
      {state.error && <span className="text-xs text-red-status">{state.error}</span>}
    </form>
  );
}
