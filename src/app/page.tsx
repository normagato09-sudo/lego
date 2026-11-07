import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CabeceraApp } from "@/components/CabeceraApp";
import { ListaPiezas } from "@/components/ListaPiezas";
import { leerPiezas, type FilaPieza } from "@/lib/piezas";

async function Lista() {
  await connection();
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
  return <ListaPiezas filas={filas} />;
}

export default function Home() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px]">
      <CabeceraApp activa="piezas" />
      <Suspense fallback={<p className="px-4 pt-6 text-sm text-ink/60">Cargando piezas…</p>}>
        <Lista />
      </Suspense>
      <Link
        href="/anadir"
        className="fixed bottom-5 left-1/2 z-10 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full bg-brick px-6 text-base font-semibold text-white"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Añadir pieza
      </Link>
    </div>
  );
}
