import { FormularioEntrar } from "./FormularioEntrar";

export const metadata = { title: "Entrar · LEGO Inventario" };

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col justify-center px-4 py-10">
      <div className="flex flex-col items-center gap-3">
        <svg width="64" height="44" viewBox="0 0 64 44" aria-hidden="true">
          <rect x="10" y="2" width="14" height="8" rx="2" fill="#c91a09" />
          <rect x="40" y="2" width="14" height="8" rx="2" fill="#c91a09" />
          <rect x="2" y="9" width="60" height="33" rx="4" fill="#c91a09" />
        </svg>
        <h1 className="font-display text-3xl font-bold">LEGO Inventario</h1>
      </div>
      <FormularioEntrar />
    </main>
  );
}
