export default function Home() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <LegoBrick />
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-4xl font-semibold text-ink sm:text-5xl">
          LEGO Inventory
        </h1>
        <p className="max-w-sm text-base text-steel">
          Organiza tu colección de piezas LEGO.
        </p>
      </div>
    </main>
  );
}

function LegoBrick() {
  return (
    <svg
      width="104"
      height="76"
      viewBox="0 0 104 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Pieza LEGO"
    >
      <rect x="4" y="24" width="96" height="48" rx="6" className="fill-brick" />
      <circle cx="26" cy="14" r="11" className="fill-brick" />
      <circle cx="52" cy="14" r="11" className="fill-brick" />
      <circle cx="78" cy="14" r="11" className="fill-brick" />
      <circle cx="26" cy="14" r="6.5" className="fill-brick-dark" />
      <circle cx="52" cy="14" r="6.5" className="fill-brick-dark" />
      <circle cx="78" cy="14" r="6.5" className="fill-brick-dark" />
    </svg>
  );
}
