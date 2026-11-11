import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CabeceraVolver } from "@/components/Cabecera";
import { claveDeGrupo } from "@/lib/agrupar";
import { leerPiezas, type FilaPieza } from "@/lib/piezas";
import { VariantesLista } from "./VariantesLista";

export const metadata = { title: "Variantes · LEGO Inventario" };

async function Contenido({ searchParams }: { searchParams: PageProps<"/variantes">["searchParams"] }) {
  const { g } = await searchParams;
  if (typeof g !== "string" || !g) redirect("/");

  let filas: FilaPieza[] | null = null;
  try {
    filas = await leerPiezas();
  } catch (e) {
    console.error("No se pudieron leer las piezas", e);
  }
  if (!filas) {
    return (
      <p role="alert" className="m-4 rounded-[10px] border border-brick bg-brick-soft p-3 text-sm text-brick">
        No se pudieron cargar las piezas. Revisa la conexión y recarga la página.
      </p>
    );
  }

  const delGrupo = filas.filter((f) => claveDeGrupo(f) === g);
  if (delGrupo.length === 0) redirect("/");
  return <VariantesLista filas={delGrupo} />;
}

export default function Page(props: PageProps<"/variantes">) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px]">
      <CabeceraVolver titulo="Variantes" volverA="/" />
      <Suspense fallback={<p className="px-4 pt-6 text-sm text-ink/60">Cargando…</p>}>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
      <div className="px-4 pb-10">
        <Link
          href="/"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-line bg-card font-semibold"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Volver a la lista
        </Link>
      </div>
    </div>
  );
}
