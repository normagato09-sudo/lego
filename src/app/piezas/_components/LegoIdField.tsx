"use client";

import { useEffect, useState } from "react";
import { searchParts, type CatalogPart } from "../catalog-actions";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Pieza del catálogo que corresponde al ID escrito (null si no está o aún no se sabe). */
  part: CatalogPart | null;
  error?: string;
};

const DEBOUNCE_MS = 300;

/**
 * Campo del ID de diseño con sugerencias del catálogo mientras se escribe y,
 * debajo, la foto y el nombre oficiales de la pieza para confirmar.
 */
export function LegoIdField({ value, onChange, part, error }: Props) {
  const [results, setResults] = useState<{ term: string; parts: CatalogPart[] } | null>(null);
  const [open, setOpen] = useState(false);
  const term = value.trim();

  useEffect(() => {
    if (term.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchParts(term)
        .then((parts) => !cancelled && setResults({ term, parts }))
        .catch(() => {});
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  // Solo las sugerencias del texto actual, y sin repetir lo que ya está escrito tal cual.
  const suggestions =
    results && results.term === term && !(part && part.part_num === term) ? results.parts : [];
  const showList = open && suggestions.length > 0;

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor="lego_id" className="font-medium text-ink">
        ID de diseño
      </label>
      <div className="relative">
        <input
          id="lego_id"
          name="lego_id"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          // Retraso para que el toque en una sugerencia llegue antes de cerrar la lista.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          required
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls="lego-id-suggestions"
          aria-autocomplete="list"
          className="input"
          placeholder="p. ej. 3001 o «brick 2 x 4»"
        />
        {showList && (
          <ul
            id="lego-id-suggestions"
            role="listbox"
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-[50vh] overflow-y-auto rounded-lg border border-line-strong bg-paper py-1 shadow-lg"
          >
            {suggestions.map((s) => (
              <li key={s.part_num} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(s.part_num);
                    setOpen(false);
                  }}
                  className="flex min-h-14 w-full items-center gap-3 px-3 py-1 text-left hover:bg-fog active:bg-fog"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-white">
                    {s.img_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.img_url} alt="" className="h-full w-full object-contain" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-mono text-ink">{s.part_num}</span>
                    <span className="truncate text-xs text-steel">{s.name}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <span className="text-xs text-red-status">{error}</span>}

      {part && (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-paper p-2">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-white">
            {part.img_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={part.img_url} alt="" className="h-full w-full object-contain" />
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm text-ink">{part.name}</span>
            {part.part_num !== term && (
              <span className="text-xs text-steel">Rebrickable: {part.part_num}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
