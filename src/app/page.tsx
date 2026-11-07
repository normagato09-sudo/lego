export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col items-center justify-center gap-4 px-4">
      <svg width="64" height="44" viewBox="0 0 64 44" aria-hidden="true">
        <rect x="10" y="2" width="14" height="8" rx="2" fill="#c91a09" />
        <rect x="40" y="2" width="14" height="8" rx="2" fill="#c91a09" />
        <rect x="2" y="9" width="60" height="33" rx="4" fill="#c91a09" />
      </svg>
      <h1 className="font-display text-3xl font-bold">LEGO Inventario</h1>
      <p className="text-center text-ink/70">
        Paso 1 listo: la app ya está en marcha.
      </p>
    </main>
  );
}
