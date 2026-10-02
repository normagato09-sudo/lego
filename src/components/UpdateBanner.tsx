"use client";

import { useEffect, useState } from "react";

/** Versión con la que se compiló esta copia de la app (ver next.config.ts). */
const CURRENT = process.env.NEXT_PUBLIC_APP_VERSION;
const CHECK_EVERY_MS = 5 * 60_000;

/**
 * Aviso "Hay una versión nueva — Actualizar". Pregunta al servidor qué versión
 * está publicada al abrir la app, al volver a ella y cada 5 minutos.
 */
export function UpdateBanner() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!CURRENT || CURRENT === "dev") return;

    async function check() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { version } = (await res.json()) as { version?: string };
        if (version && version !== CURRENT) setAvailable(true);
      } catch {}
    }
    function onVisible() {
      if (document.visibilityState === "visible") check();
    }

    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!available) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-3 shadow-lg"
    >
      <span className="text-sm text-ink">Hay una versión nueva</span>
      <button
        type="button"
        onClick={() => location.reload()}
        className="btn btn-primary text-xs"
      >
        Actualizar
      </button>
    </div>
  );
}
