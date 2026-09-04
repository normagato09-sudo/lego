import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brick" aria-hidden="true" />
          Mi Colección LEGO
        </Link>
        <nav className="flex gap-1 text-sm">
          <Link href="/" className="btn-ghost">
            Inicio
          </Link>
          <Link href="/piezas" className="btn-ghost">
            Piezas
          </Link>
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
