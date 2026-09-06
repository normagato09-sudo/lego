"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

/**
 * Aviso discreto de instalación PWA.
 * Solo aparece si el navegador dispara el evento real "beforeinstallprompt"
 * (Chrome/Edge en Android y escritorio). En navegadores que no lo soportan
 * (Safari/iOS) simplemente no se muestra nada; no se simula un botón falso.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    if (dismissed) return;

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function handleAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {}
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  function handleDismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-3 shadow-lg sm:left-auto sm:right-4 sm:translate-x-0">
      <span className="text-sm text-ink">Instala LEGO Inventory para acceso rápido</span>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={handleInstall} className="btn btn-primary text-xs">
          Instalar
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="btn-ghost text-xs"
          aria-label="Descartar aviso de instalación"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
