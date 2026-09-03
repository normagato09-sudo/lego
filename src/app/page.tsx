import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-5 py-20 text-center">
      <h1 className="text-3xl font-semibold text-ink">Mi Colección LEGO</h1>
      <p className="max-w-md text-sm text-steel">
        Organiza tu inventario personal de piezas, colores y ubicaciones.
      </p>
      <span className="inline-flex items-center rounded-full bg-green-tint px-3 py-1 text-xs font-medium text-green">
        Paso 4: inventario de piezas listo
      </span>
      <Link href="/piezas" className="btn btn-primary mt-2">
        Ver mis piezas
      </Link>
    </main>
  );
}
