import type { MetadataRoute } from "next";

// Datos para instalar la web como app en el móvil (PWA).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LEGO Inventario",
    short_name: "LEGO",
    description: "Organiza tu colección de piezas LEGO por forma, caja y bolsa.",
    lang: "es",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f2ef",
    theme_color: "#16161a",
    icons: [
      { src: "/iconos/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/iconos/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/iconos/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
