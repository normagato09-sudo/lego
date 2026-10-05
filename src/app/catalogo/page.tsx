export const dynamic = "force-dynamic";
import { getCatalogCategories, getCatalogPage } from "@/lib/catalog-browse";
import { CatalogExplorer } from "./_components/CatalogExplorer";

export default async function CatalogoPage() {
  // La primera página viene ya del servidor; el resto se carga al bajar.
  const [categories, firstPage] = await Promise.all([
    getCatalogCategories(),
    getCatalogPage({ q: "", categoryId: null, offset: 0 }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Catálogo</h1>
        <p className="text-sm text-steel">
          Ladrillos, placas, baldosas y Technic que todavía no tienes.
        </p>
      </div>
      <CatalogExplorer categories={categories} initialPage={firstPage} />
    </div>
  );
}
