"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CatalogCategory, CatalogPage } from "@/lib/catalog-browse";
import { loadCatalogPage } from "../actions";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/Button";
import { CatalogCard } from "./CatalogCard";

const SEARCH_DEBOUNCE_MS = 300;

type Filters = { key: string; q: string; categoryId: number | null };

function filtersOf(query: string, categoryId: number | null): Filters {
  const q = query.trim();
  return { key: `${q}|${categoryId ?? ""}`, q, categoryId };
}

/**
 * Catálogo con búsqueda, filtro por categoría y carga infinita. Cada petición
 * lleva la clave de sus filtros: si mientras tanto cambian, se descarta.
 */
export function CatalogExplorer({
  categories,
  initialPage,
}: {
  categories: CatalogCategory[];
  initialPage: CatalogPage;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [parts, setParts] = useState(initialPage.parts);
  const [total, setTotal] = useState(initialPage.total);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [shownKey, setShownKey] = useState(filtersOf("", null).key);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Filtros pedidos (los últimos) y filtros de lo que se está mostrando.
  const wanted = useRef<Filters>(filtersOf("", null));
  const shown = useRef<Filters>(filtersOf("", null));
  const sentinel = useRef<HTMLDivElement>(null);
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  const load = useCallback(async (filters: Filters, offset: number) => {
    setLoading(true);
    try {
      const page = await loadCatalogPage({ q: filters.q, categoryId: filters.categoryId, offset });
      if (wanted.current.key !== filters.key) return;
      shown.current = filters;
      setShownKey(filters.key);
      setParts((prev) => {
        if (offset === 0) return page.parts;
        const seen = new Set(prev.map((p) => p.part_num));
        return [...prev, ...page.parts.filter((p) => !seen.has(p.part_num))];
      });
      if (page.total !== null) setTotal(page.total);
      setHasMore(page.hasMore);
      setError(null);
    } catch (e) {
      if (wanted.current.key === filters.key) setError((e as Error).message);
    } finally {
      if (wanted.current.key === filters.key) setLoading(false);
    }
  }, []);

  // Al cambiar la búsqueda o la categoría: desde el principio.
  const filters = filtersOf(query, categoryId);
  useEffect(() => {
    const next = filtersOf(query, categoryId);
    wanted.current = next;
    if (next.key === shown.current.key) return;
    const timer = setTimeout(() => load(next, 0), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, categoryId, load]);

  const loadMore = useCallback(() => {
    if (wanted.current.key !== shown.current.key) return;
    load(shown.current, parts.length);
  }, [load, parts.length]);

  // Carga infinita: la siguiente página antes de llegar al final.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, error, loadMore]);

  const isStale = filters.key !== shownKey;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="catalog-search" className="sr-only">
          Buscar en el catálogo
        </label>
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por número o nombre…"
          autoComplete="off"
          className="input sm:flex-1"
        />
        <label htmlFor="catalog-category" className="sr-only">
          Categoría
        </label>
        <select
          id="catalog-category"
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(e.target.value === "" ? null : Number(e.target.value))}
          className="input sm:w-64"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <p className="mb-3 text-xs text-steel">
        {isStale || total === null
          ? "Buscando…"
          : `${total} ${total === 1 ? "pieza" : "piezas"}`}
      </p>

      {parts.length === 0 && !isStale && !loading ? (
        <div className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center">
          <p className="text-sm text-steel">No hay piezas con estos filtros.</p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${isStale ? "opacity-60" : ""}`}
        >
          {parts.map((part) => (
            <CatalogCard
              key={part.part_num}
              part={part}
              categoryName={categoryNames.get(part.part_cat_id)}
            />
          ))}
        </div>
      )}

      <div ref={sentinel} className="flex justify-center py-6">
        {hasMore && !isStale && (
          <Button type="button" variant="ghost" size="sm" onClick={loadMore} disabled={loading}>
            {loading ? "Cargando…" : "Cargar más"}
          </Button>
        )}
      </div>
    </div>
  );
}
