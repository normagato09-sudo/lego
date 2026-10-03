"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ColorSwatch } from "@/components/ColorSwatch";
import { groupByColorFamily, type ColorGroup } from "@/lib/color-families";
import type { PartColor } from "../catalog-actions";

type Props = {
  /** "empty": falta el ID de diseño; "ready": `options` son los colores a elegir. */
  status: "empty" | "loading" | "error" | "ready";
  options: PartColor[];
  /** false = la pieza no está en el catálogo y `options` son todos los colores. */
  inCatalog: boolean;
  /** Se ven también los colores que no constan para esta pieza (en su propia sección). */
  showAll: boolean;
  /** Alterna showAll; sin él no se muestra el botón. */
  onToggleShowAll?: () => void;
  selected: PartColor | null;
  onSelect: (colorId: number) => void;
  /** Texto alternativo de la foto (el ID de diseño). */
  legoId: string;
  error?: string;
};

/**
 * Selector de color: un desplegable con una cuadrícula de muestras grandes
 * y, debajo, la foto oficial de la pieza en el color elegido con su nombre.
 */
export function ColorPicker({
  status,
  options,
  inCatalog,
  showAll,
  onToggleShowAll,
  selected,
  onSelect,
  legoId,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const ready = status === "ready";
  const groupId = useId();
  const groups = groupByColorFamily(
    options.filter((o) => !o.offCatalog),
    (o) => o.color,
  );
  const otherGroups = groupByColorFamily(
    options.filter((o) => o.offCatalog),
    (o) => o.color,
  );

  function renderGroups(list: ColorGroup<PartColor>[], prefix: string) {
    return list.map(({ title, items }, i) => {
      const labelId = `${groupId}-${prefix}-${i}`;
      return (
        <div key={`${prefix}-${title}`} role="group" aria-labelledby={labelId}>
          <p
            id={labelId}
            className="sticky top-0 z-10 -mx-2 bg-paper px-3 pt-2 pb-1 text-xs font-semibold text-steel"
          >
            {title}
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-1">
            {items.map(({ color }) => {
              const isSelected = color.id === selected?.color.id;
              return (
                <button
                  key={color.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-label={color.name}
                  title={color.name}
                  onClick={() => {
                    onSelect(color.id);
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
      );
    });
  }

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

  const placeholder = {
    empty: "Escribe primero el ID de diseño",
    loading: "Cargando colores...",
    error: "No se pudieron cargar los colores",
    ready: "Elige un color",
  }[status];

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
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-[60vh] overflow-y-auto overscroll-contain rounded-lg border border-line-strong bg-paper px-2 pb-2 shadow-lg"
          >
            {renderGroups(groups, "catalog")}

            {otherGroups.length > 0 && (
              <>
                <p className="-mx-2 mt-3 border-t border-line-strong px-3 pt-3 text-sm font-semibold text-ink">
                  Otros colores (no constan para esta pieza)
                </p>
                {renderGroups(otherGroups, "other")}
              </>
            )}

            {inCatalog && onToggleShowAll && (
              <button
                type="button"
                onClick={onToggleShowAll}
                className="btn-ghost mt-3 w-full text-xs"
              >
                {showAll ? "Mostrar solo los colores del catálogo" : "Mostrar todos los colores"}
              </button>
            )}
          </div>
        )}
      </div>

      {ready && !inCatalog && (
        <span className="text-xs text-amber">
          Esta pieza no está en el catálogo: se muestran todos los colores.
        </span>
      )}
      {error && <span className="text-xs text-red-status">{error}</span>}

      {selected && (
        <div className="mt-1 flex flex-col items-center gap-1">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
            {selected.img_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.img_url}
                alt={`${legoId} en ${selected.color.name}`}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <ColorSwatch color={selected.color} size={64} shape="square" />
            )}
          </div>
          <span className="text-xs text-steel">{selected.color.name}</span>
        </div>
      )}
      {selected?.offCatalog && (
        <span className="text-center text-xs text-amber">
          Según el catálogo esta pieza no existe en {selected.color.name}: no hay foto oficial ni
          ID de elemento.{" "}
          <label htmlFor="piece-photo-camera" className="cursor-pointer font-medium underline">
            Hacer foto
          </label>
        </span>
      )}
    </div>
  );
}
