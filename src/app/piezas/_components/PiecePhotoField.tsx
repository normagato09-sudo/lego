"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { PieceIcon } from "@/components/PieceIcon";

type Props = {
  initialUrl?: string | null;
};

/**
 * Campo de foto de la pieza.
 * Por ahora es solo previsualización en memoria del navegador (URL.createObjectURL),
 * sin conexión a base de datos ni a almacenamiento externo. Preparado para conectarse
 * más adelante (por ejemplo, subiendo a Supabase Storage y guardando la URL en image_url).
 */
export function PiecePhotoField({ initialUrl = null }: Props) {
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setPreview(url);
  }

  function handleRemove() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-ink">Foto de la pieza</span>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-fog">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Vista previa de la pieza"
              className="h-full w-full object-cover"
            />
          ) : (
            <PieceIcon className="h-8 w-11 text-ink-soft/40" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="btn-ghost cursor-pointer text-xs">
            {preview ? "Cambiar foto" : "Subir foto"}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-red-status"
            >
              Eliminar foto
            </Button>
          )}
        </div>
      </div>
      <span className="text-xs text-steel">
        Por ahora la foto solo se previsualiza en este dispositivo; todavía no se guarda.
      </span>
    </div>
  );
}
