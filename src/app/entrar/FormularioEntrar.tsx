"use client";

import { useActionState } from "react";
import { entrar, type EstadoEntrar } from "./acciones";

export function FormularioEntrar() {
  const [estado, accion, entrando] = useActionState<EstadoEntrar, FormData>(entrar, {});
  return (
    <form action={accion} className="mt-8 space-y-4 rounded-[10px] border border-line bg-card p-4">
      <label className="block">
        <span className="font-display text-lg font-bold">Contraseña</span>
        <input
          name="contrasena"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="mt-2 h-12 w-full rounded-[10px] border border-line bg-card px-4 text-base outline-none focus:border-brick"
        />
      </label>
      {estado.error && (
        <p role="alert" className="rounded-[10px] border border-brick bg-brick-soft p-3 text-sm text-brick">
          {estado.error}
        </p>
      )}
      <button
        type="submit"
        disabled={entrando}
        className="h-14 w-full rounded-[10px] bg-brick text-lg font-semibold text-white disabled:opacity-60"
      >
        {entrando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
