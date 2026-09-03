import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LEGO Inventory",
  description: "Organiza tu colección personal de piezas LEGO",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
