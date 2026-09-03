export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">🧱 LEGO Inventory</h1>
      <p className="max-w-md text-base text-gray-600 dark:text-gray-400">
        El proyecto base está funcionando correctamente. Next.js, TypeScript y
        Tailwind CSS están configurados y listos para empezar a construir.
      </p>
      <span className="mt-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
        ✅ Paso 1 completado
      </span>
    </main>
  );
}
