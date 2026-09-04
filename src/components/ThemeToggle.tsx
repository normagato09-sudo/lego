"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  // Evita parpadeo/desajuste mientras no sabemos aún el tema real en el cliente.
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" aria-label="Cambiar tema" disabled>
        🌙
      </Button>
    );
  }

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