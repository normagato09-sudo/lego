"use client";

import { useEffect, useState } from "react";

const CADA_MS = 60_000; // comprobar cada minuto

/**
 * Compara la versión con la que se abrió la app con la que está publicada ahora.
 * Si hay una nueva, enseña un aviso con el botón "Actualizar".
 * En local (sin versión) no hace nada.
 */
export function AvisoVersion({ version }: { version: string | null }) {
  const [hayNueva, setHayNueva] = useState(false);

  useEffect(() => {
    if (!version) return;
    let parado = false;

    async function comprobar() {
      if (parado || document.visibilityState === "hidden") return;
      try {
        const respuesta = await fetch("/api/version", { cache: "no-store" });
        if (!respuesta.ok) return; // p. ej. sin contraseña todavía: no pasa nada
        const datos = (await respuesta.json()) as { version: string | null };
        if (!parado && datos.version && datos.version !== version) setHayNueva(true);
      } catch {
        // Sin conexión: se vuelve a intentar en la siguiente vuelta.
      }
    }

    const reloj = setInterval(comprobar, CADA_MS);
    const alVolver = () => {
      if (document.visibilityState === "visible") void comprobar();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      parado = true;
      clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [version]);

  if (!hayNueva) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 border-b border-line bg-card pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto flex w-full max-w-[390px] items-center gap-3 px-4 py-2">
        <p className="flex-1 text-sm font-medium">Hay una versión nueva</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 rounded-[10px] bg-brick px-4 text-sm font-semibold text-white"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
