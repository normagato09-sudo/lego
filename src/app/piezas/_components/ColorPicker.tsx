"use client";

import { useEffect, useRef, useState } from "react";
import type { Color } from "@/lib/types";
import { ColorSwatch } from "@/components/ColorSwatch";
import { getPartColors, type PartColor } from "../catalog-actions";

type Props = {
  /** ID de diseño escrito en el formulario: decide qué colores se ofrecen. */
  legoId: string;
  /** Todos los colores: se usan si la pieza no está en el catálogo. */
  allColors: Color[];
  defaultColorId?: number;
  error?: string;
};

type Options = {
  legoId: string;
  /** false = la pieza no está en el catálogo y se ofrecen todos los colores. */
  inCatalog: boolean;
  items: PartColor[];
};

const DEBOUNCE_MS = 400;

/**
 * Selector de color: un desplegable con una cuadrícula de muestras grandes
 * (solo los colores en los que existe la pieza según el catálogo) y, debajo,
 * la foto oficial de la pieza en el color elegido con su nombre.
 */
export function ColorPicker({ legoId, allColors, defaultColorId, error }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(defaultColorId ?? null);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Options | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const trimmed = legoId.trim();
  const loading = trimmed !== "" && options?.legoId !== trimmed && !loadError;

  // Carga los colores de la pieza cuando se deja de escribir el ID de diseño.
  useEffect(() => {
    if (!trimmed) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const items = await getPartColors(trimmed);
        if (cancelled) return;
        const inCatalog = items.length > 0;
        const next = inCatalog
          ? items
          : allColors.map((color) => ({ color, img_url: null }));
        setLoadError(null);
        setOptions({ legoId: trimmed, inCatalog, items: next });
        // Si el color elegido no existe para esta pieza, se quita.
        setSelectedId((id) => (id !== null && next.some((o) => o.color.id === id) ? id : null));
      } catch (e) {
        if (!cancelled) setLoadError((e as Error).message);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setLoadError(null);
    };
  }, [trimmed, allColors]);

  // Cierra el desplegable al tocar fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const ready = trimmed !== "" && options?.legoId === trimmed;
  const items = ready ? options.items : [];
  const selected = items.find((o) => o.color.id === selectedId) ?? null;

  let placeholder = "Elige un color";
  if (!trimmed) placeholder = "Escribe primero el ID de diseño";
  else if (loadError) placeholder = "No se pudieron cargar los colores";
  else if (loading) placeholder = "Cargando colores...";

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span id="color-label" className="font-medium text-ink">
        Color
      </span>
      <input type="hidden" name="color_id" value={selected?.color.id ?? ""} />

      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={!ready}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby="color-label"
          onClick={() => setOpen((o) => !o)}
          className="input flex min-h-12 items-center gap-3 text-left disabled:opacity-60"
        >
          {selected ? (
            <ColorSwatch color={selected.color} size={28} />
          ) : (
            <span className="text-steel">{placeholder}</span>
          )}
          <span aria-hidden className="ml-auto text-steel">
            {open ? "▲" : "▼"}
          </span>
        </button>

        {open && ready && (
          <div
            role="listbox"
            aria-labelledby="color-label"
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-[60vh] overflow-y-auto rounded-lg border border-line-strong bg-paper p-2 shadow-lg"
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-1">
              {items.map(({ color }) => {
                const isSelected = color.id === selectedId;
                return (
                  <button
                    key={color.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-label={color.name}
                    title={color.name}
                    onClick={() => {
                      setSelectedId(color.id);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className={`flex h-12 items-center justify-center rounded-full ${
                      isSelected ? "bg-brick-tint ring-2 ring-brick" : "active:bg-fog"
                    }`}
                  >
                    <ColorSwatch color={color} size={40} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {ready && !options.inCatalog && (
        <span className="text-xs text-amber">
          Esta pieza no está en el catálogo: se muestran todos los colores.
        </span>
      )}
      {loadError && <span className="text-xs text-red-status">{loadError}</span>}
      {error && <span className="text-xs text-red-status">{error}</span>}

      {selected && (
        <div className="mt-1 flex flex-col items-center gap-1">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-line bg-paper">
            {selected.img_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.img_url}
                alt={`${trimmed} en ${selected.color.name}`}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <ColorSwatch color={selected.color} size={64} shape="square" />
            )}
          </div>
          <span className="text-xs text-steel">{selected.color.name}</span>
        </div>
      )}
    </div>
  );
}
