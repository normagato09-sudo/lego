import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { AvisoVersion } from "@/components/AvisoVersion";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "LEGO Inventario",
  description: "Organiza tu colección de piezas LEGO por forma, caja y bolsa.",
  applicationName: "LEGO Inventario",
  // Para iPhone: abrir a pantalla completa con su nombre e icono.
  appleWebApp: {
    capable: true,
    title: "LEGO",
    statusBarStyle: "default",
  },
  icons: {
    apple: [{ url: "/iconos/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16161a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-fog font-sans text-ink">
        {children}
        {/* Versión con la que se abrió la app (en local no hay, y no sale aviso). */}
        <AvisoVersion version={process.env.VERCEL_GIT_COMMIT_SHA ?? null} />
      </body>
    </html>
  );
}
