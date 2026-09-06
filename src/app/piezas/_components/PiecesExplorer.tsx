"use client";

import { useMemo, useState } from "react";
import type { PieceWithDetails } from "@/lib/types";
import { searchPieces } from "@/lib/search";
import { Button } from "@/components/Button";
import { PieceCard } from "./PieceCard";

type Props = {
  pieces: PieceWithDetails[];
};

/**
 * Listado de piezas con búsqueda integrada.
 * Las piezas ya llegan cargadas desde el servidor (una sola consulta en
 * PiezasPage); aquí solo se filtran en el cliente con `searchPieces`
 * (src/lib/search.ts), sin volver a consultar Supabase ni reimplementar
 * el filtrado.
 */
export function PiecesExplorer({ pieces }: Props) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;
  const filtered = useMemo(() => searchPieces(pieces, query), [pieces, query]);

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="piece-search" className="sr-only">
          Buscar piezas
        </label>
        <input
          id="piece-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, ID, color o ubicación…"
          className="input"
        />
      </div>

      {isSearching && (
        <p className="mb-3 text-xs text-steel">
          {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"} para «{trimmedQuery}»
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center">
          <p className="mb-3 text-sm text-steel">
            No se encontraron piezas para «{trimmedQuery}».
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setQuery("")}>
            Limpiar búsqueda
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      )}
    </div>
  );
}
