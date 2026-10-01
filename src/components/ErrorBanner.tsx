/**
 * Aviso de error server-side, con el mismo estilo que ya usaba el error
 * de PieceForm. Pensado para mensajes que llegan por query string (p. ej.
 * ?deleteError=... tras un redirect desde una Server Action). `children`
 * permite añadir una acción tras el mensaje (p. ej. un enlace).
 */
export function ErrorBanner({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <p className="rounded-md border border-red-status/30 bg-red-tint px-3 py-2 text-sm text-red-status">
      {message} {children}
    </p>
  );
}
