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
 * Selector de color: una ventana centrada (modal) con una cuadrícula de
 * muestras grandes que siempre cabe en la pantalla y tiene su propio scroll,
 * y, debajo del botón, la foto oficial de la pieza en el color elegido.
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
  const dialogRef = useRef<HTMLDialogElement>(null);
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
            className="sticky top-0 z-10 -mx-3 bg-paper px-3 pt-2 pb-1 text-xs font-semibold text-steel"
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
                    close();
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

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Abre y cierra el <dialog> nativo (atrapa el foco y cierra con Escape) y,
  // mientras está abierto, la página de detrás no se desplaza.
  const isOpen = open && ready;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;
    dialog.showModal();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [isOpen]);

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

      <button
        ref={triggerRef}
        type="button"
        disabled={!ready}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-labelledby="color-label"
        onClick={() => setOpen(true)}
        className="input flex min-h-12 items-center gap-3 text-left disabled:opacity-60"
      >
        {selected ? (
          <ColorSwatch color={selected.color} size={28} />
        ) : (
          <span className="text-steel">{placeholder}</span>
        )}
        <span aria-hidden className="ml-auto text-steel">
          ▼
        </span>
      </button>

      {/* El preflight de Tailwind quita el margin:auto del <dialog>: m-auto lo centra. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={`${groupId}-title`}
        // Escape: el navegador cierra el diálogo; aquí se sincroniza el estado.
        onClose={() => open && close()}
        // Un clic en el fondo oscuro llega al propio <dialog> (el contenido lo tapa entero).
        onClick={(e) => e.target === e.currentTarget && close()}
        // Deslizar dentro no debe recargar la página (PullToRefresh).
        data-no-pull
        className="m-auto h-fit max-h-[85dvh] w-[calc(100vw-2rem)] max-w-lg overflow-hidden rounded-xl border border-line-strong bg-paper p-0 text-ink shadow-xl backdrop:bg-black/50"
      >
        {isOpen && (
          <div className="flex max-h-[85dvh] flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h2 id={`${groupId}-title`} className="text-base font-semibold">
                Elige un color
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-steel hover:bg-fog active:bg-fog"
              >
                ✕
              </button>
            </div>

            <div
              role="listbox"
              aria-labelledby={`${groupId}-title`}
              className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-3 pb-3"
            >
              {renderGroups(groups, "catalog")}

              {otherGroups.length > 0 && (
                <>
                  <p className="-mx-3 mt-3 border-t border-line-strong px-3 pt-3 text-sm font-semibold text-ink">
                    Otros colores (no constan para esta pieza)
                  </p>
                  {renderGroups(otherGroups, "other")}
                </>
              )}
            </div>

            {inCatalog && onToggleShowAll && (
              <div className="border-t border-line px-4 py-3">
                <button type="button" onClick={onToggleShowAll} className="btn-ghost w-full text-xs">
                  {showAll ? "Mostrar solo los colores del catálogo" : "Mostrar todos los colores"}
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>

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
