# Historial de parches aplicados

Este archivo sustituye a los scripts `apply-*.js` que antes vivían en la raíz
del proyecto (`apply-busqueda-estadisticas.js`, `apply-componentes.js`,
`apply-pwa.js`, `apply-responsive-header.js`). Esos scripts generaban archivos
a partir de contenido codificado en base64; una vez ejecutados y con el
resultado ya versionado en `src/` y `public/`, no aportaban nada más que
ruido en la raíz del repo y errores de ESLint (`no-require-imports`) al
correr el linter sobre todo el proyecto.

Se conserva aquí un resumen de qué hizo cada uno, por si hace falta rastrear
cuándo se introdujo algo.

## 1. `apply-componentes.js`
Extrajo componentes reutilizables (`Button`, `Card`, `PieceIcon`) a partir de
clases repetidas en varias páginas, y actualizó los archivos que las usaban.
No cambió funcionalidad, datos, rutas, responsive, modo oscuro ni PWA.

Archivos creados/actualizados:
`src/components/Button.tsx`, `src/components/Card.tsx`,
`src/components/PieceIcon.tsx`, `src/components/ThemeToggle.tsx`,
`src/components/SiteHeader.tsx`, `src/app/piezas/page.tsx`,
`src/app/piezas/_components/PieceCard.tsx`,
`src/app/piezas/_components/DeletePieceButton.tsx`,
`src/app/piezas/_components/QuantityStepper.tsx`,
`src/app/piezas/_components/PieceForm.tsx`,
`src/app/piezas/_components/PiecePhotoField.tsx`,
`src/app/piezas/[id]/page.tsx`.

## 2. `apply-pwa.js`
Implementó la PWA: manifest, iconos, Service Worker y el aviso de
instalación (`InstallPrompt`), y actualizó `layout.tsx` para registrarlos.

Archivos creados/actualizados:
`public/manifest.webmanifest`, `public/sw.js`, `public/icon-192.png`,
`public/icon-512.png`, `public/icon-maskable-192.png`,
`public/icon-maskable-512.png`, `public/favicon-16.png`,
`public/favicon-32.png`, `public/apple-touch-icon.png`,
`src/components/InstallPrompt.tsx`, `src/app/layout.tsx`.

## 3. `apply-busqueda-estadisticas.js`
Preparó la arquitectura de búsqueda y estadísticas, como archivos nuevos sin
tocar nada existente. No conecta con ninguna página todavía: es código listo
para cuando se construyan esas pantallas (ver nota en `src/lib/search.ts` y
`src/lib/stats.ts`).

Archivos creados: `src/lib/search.ts`, `src/lib/stats.ts`,
`src/components/StatCard.tsx`.

## 4. `apply-responsive-header.js`
Añadió `flex-wrap` a `SiteHeader.tsx` para que no se rompa en pantallas muy
estrechas.

Archivo actualizado: `src/components/SiteHeader.tsx`.
