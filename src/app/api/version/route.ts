/**
 * Versión publicada ahora mismo. La app compara con la suya (incluida al
 * compilar) para avisar de que hay una nueva (ver UpdateBanner).
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { version: process.env.NEXT_PUBLIC_APP_VERSION },
    { headers: { "Cache-Control": "no-store" } },
  );
}
