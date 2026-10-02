"use client";

import { useEffect, useState } from "react";

/** Distancia (px) que hay que deslizar hacia abajo para recargar. */
const THRESHOLD = 70;

/**
 * Deslizar hacia abajo desde arriba del todo para recargar. Solo con la app
 * instalada: en el navegador ya existe ese gesto y se recargaría dos veces.
 * Se ignora si el dedo empieza en un desplegable o en algo marcado con
 * `data-no-pull` (el recorte de la foto).
 */
export function PullToRefresh() {
  const [pull, setPull] = useState(0);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!standalone) return;

    let startY: number | null = null;
    let distance = 0;

    function onStart(e: TouchEvent) {
      const blocked = (e.target as Element).closest("[data-no-pull], [role=listbox]");
      startY = window.scrollY <= 0 && !blocked ? e.touches[0].clientY : null;
      distance = 0;
    }
    function onMove(e: TouchEvent) {
      if (startY === null) return;
      distance = Math.max(0, e.touches[0].clientY - startY);
      setPull(Math.min(distance, THRESHOLD * 1.5));
    }
    function onEnd() {
      if (startY !== null && distance >= THRESHOLD) location.reload();
      startY = null;
      distance = 0;
      setPull(0);
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  if (pull === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center"
      style={{ transform: `translateY(${pull - 40}px)` }}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper shadow ${
          pull >= THRESHOLD ? "text-brick" : "text-steel"
        }`}
        style={{ transform: `rotate(${pull * 4}deg)` }}
      >
        ↻
      </span>
    </div>
  );
}
