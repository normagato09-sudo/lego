"use server";

import { getCatalogPage, type CatalogPage } from "@/lib/catalog-browse";

/** Siguiente página del catálogo (o la primera al cambiar la búsqueda o la categoría). */
export async function loadCatalogPage(args: {
  q: string;
  categoryId: number | null;
  offset: number;
}): Promise<CatalogPage> {
  return getCatalogPage(args);
}
