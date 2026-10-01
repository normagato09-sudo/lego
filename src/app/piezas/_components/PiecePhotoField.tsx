"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { PieceIcon } from "@/components/PieceIcon";

type Props = {
  initialUrl?: string | null;
  error?: string;
};

const MAX_SIDE = 1600;
const QUALITY = 0.82;

/**
 * Redimensiona la imagen a un máximo de MAX_SIDE px por lado y la comprime a
 * WebP (o JPEG si el navegador no sabe codificar WebP), para que las fotos
 * del móvil no superen el límite de subida.
 */
async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
  // Si no soporta WebP, toBlob devuelve PNG: en ese caso se usa JPEG.
  let blob = await toBlob("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
  if (!blob) throw new Error("No se pudo comprimir la imagen.");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${baseName}.${ext}`, { type: blob.type });
}

/**
 * Campo de foto de la pieza. La foto se comprime en el navegador y se envía
 * con el formulario en el campo "photo"; la server action la sube a Supabase
 * Storage. Si se quita una foto ya guardada, se envía remove_photo=1.
 */
export function PiecePhotoField({ initialUrl = null, error }: Props) {
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  // React vacía el formulario al terminar la action (también si devuelve
  // error): se vuelve al estado inicial para que la vista previa no muestre
  // una foto que ya no se enviaría.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    function handleReset() {
      setObjectUrl(null);
      setPreview(initialUrl);
      setRemoved(false);
    }
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [initialUrl]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    let finalFile = file;
    setProcessing(true);
    try {
      finalFile = await compressImage(file);
      const dt = new DataTransfer();
      dt.items.add(finalFile);
      input.files = dt.files;
    } catch {
      // Si no se puede comprimir, se envía el original; el servidor valida el tamaño.
    } finally {
      setProcessing(false);
    }

    const url = URL.createObjectURL(finalFile);
    setObjectUrl(url);
    setPreview(url);
    setRemoved(false);
  }

  function handleRemove() {
    setObjectUrl(null);
    setPreview(null);
    setRemoved(initialUrl !== null);
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
            {processing ? "Procesando..." : preview ? "Cambiar foto" : "Subir foto"}
            <input
              ref={inputRef}
              name="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={processing}
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
      {removed && <input type="hidden" name="remove_photo" value="1" />}
      {error && <span className="text-xs text-red-status">{error}</span>}
    </div>
  );
}
