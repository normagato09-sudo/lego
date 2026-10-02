"use client";

import { useMemo, useState } from "react";
import type { PieceWithDetails } from "@/lib/types";
import { groupPiecesByDesign } from "@/lib/piece-groups";
import { searchPieceGroups } from "@/lib/search";
import { Button } from "@/components/Button";
import { DesignCard } from "./DesignCard";

type Props = {
  pieces: PieceWithDetails[];
};

/**
 * Listado de piezas agrupadas por ID de diseño, con búsqueda integrada.
 * Las piezas ya llegan cargadas desde el servidor (una sola consulta en
 * PiezasPage); aquí se agrupan y se filtran en el cliente con `searchPieceGroups`
 * (src/lib/search.ts), sin volver a consultar Supabase ni reimplementar
 * el filtrado.
 */
export function PiecesExplorer({ pieces }: Props) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;
  const groups = useMemo(() => groupPiecesByDesign(pieces), [pieces]);
  const filtered = useMemo(() => searchPieceGroups(groups, query), [groups, query]);

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
          placeholder="Buscar por ID de diseño, ID de pieza, color o ubicación…"
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
          {filtered.map((group) => (
            <DesignCard key={group.legoId} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
