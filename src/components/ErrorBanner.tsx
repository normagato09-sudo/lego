/**
 * Aviso de error server-side, con el mismo estilo que ya usaba el error
 * de PieceForm. Pensado para mensajes que llegan por query string (p. ej.
 * ?deleteError=... tras un redirect desde una Server Action).
 */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-red-status/30 bg-red-tint px-3 py-2 text-sm text-red-status">
      {message}
    </p>
  );
}
