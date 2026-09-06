"use client";

import { useSyncExternalStore } from "react";
import { Button } from "./Button";

type Theme = "light" | "dark";

/** Nombre del evento con el que este componente avisa de un cambio de tema. */
const THEME_EVENT = "lego-inventory:theme-change";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// En el servidor no hay `document`; devolver null nos permite mostrar el
// botón deshabilitado hasta que se conozca el tema real en el cliente,
// evitando parpadeo/desajuste de hidratación.
function getServerSnapshot(): Theme | null {
  return null;
}

export function ThemeToggle() {
  // useSyncExternalStore lee el tema real (clase del <html>) de forma segura
  // para hidratación, sin necesitar un useEffect que llame a setState al
  // montar (lo cual provoca renders en cascada evitables).
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    if (theme === null) return;
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {}
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  // Evita parpadeo/desajuste mientras no sabemos aún el tema real en el cliente
  // (theme es null hasta la hidratación, ver getServerSnapshot arriba).
  if (theme === null) {
    return (
      <Button variant="ghost" size="sm" aria-label="Cambiar tema" disabled>
        🌙
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? "☀️" : "🌙"}
    </Button>
  );
}