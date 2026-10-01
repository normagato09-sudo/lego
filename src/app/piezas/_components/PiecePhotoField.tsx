"use client";

import { useEffect, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import { Button } from "@/components/Button";
import { PieceIcon } from "@/components/PieceIcon";
import { PhotoCropper } from "./PhotoCropper";

type Props = {
  initialUrl?: string | null;
  error?: string;
};

const MAX_SIDE = 1600;
const QUALITY = 0.82;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    image.src = src;
  });
}

/**
 * Dibuja solo el área recortada (con la rotación aplicada) directamente en un
 * lienzo de como mucho MAX_SIDE px y la comprime a WebP (o JPEG si el
 * navegador no codifica WebP). No crea un lienzo intermedio del tamaño de la
 * foto rotada, que en iOS puede pasar del límite de memoria del canvas.
 */
async function cropAndCompress(src: string, area: Area, rotation: number): Promise<File> {
  const img = await loadImage(src);

  const rad = (rotation * Math.PI) / 180;
  // Caja que ocupa la imagen rotada: el área de react-easy-crop está en ese espacio.
  const boxW = Math.abs(Math.cos(rad) * img.width) + Math.abs(Math.sin(rad) * img.height);
  const boxH = Math.abs(Math.sin(rad) * img.width) + Math.abs(Math.cos(rad) * img.height);

  const size = Math.max(1, Math.round(Math.min(area.width, MAX_SIDE)));
  const scale = size / area.width;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // esquinas vacías al rotar
  ctx.fillRect(0, 0, size, size);
  ctx.scale(scale, scale);
  ctx.translate(-area.x + boxW / 2, -area.y + boxH / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
  // Si no soporta WebP, toBlob devuelve PNG: en ese caso se usa JPEG.
  let blob = await toBlob("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
  if (!blob) throw new Error("No se pudo comprimir la imagen.");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `pieza.${ext}`, { type: blob.type });
}

/**
 * Campo de foto de la pieza. La foto se hace con la cámara o se elige de la
 * galería, se recorta en PhotoCropper y se comprime en el navegador. El
 * resultado va en el input oculto "photo"; la server action lo sube a
 * Supabase Storage. Si se quita una foto ya guardada, se envía remove_photo=1.
 */
export function PiecePhotoField({ initialUrl = null, error }: Props) {
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  // React vacía el formulario al terminar la action (también si devuelve
  // error): se vuelve al estado inicial para que la vista previa no muestre
  // una foto que ya no se enviaría.
  useEffect(() => {
    const form = photoInputRef.current?.form;
    if (!form) return;
    function handleReset() {
      setObjectUrl(null);
      setPreview(initialUrl);
      setRemoved(false);
    }
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [initialUrl]);

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Se vacía para que elegir otra vez la misma foto vuelva a abrir el editor.
    e.target.value = "";
    if (!file) return;
    setCropError(null);
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleCropConfirm(area: Area, rotation: number) {
    if (!cropSrc) return;
    setProcessing(true);
    try {
      const file = await cropAndCompress(cropSrc, area, rotation);
      const dt = new DataTransfer();
      dt.items.add(file);
      if (photoInputRef.current) photoInputRef.current.files = dt.files;

      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      setPreview(url);
      setRemoved(false);
    } catch {
      setCropError("No se pudo procesar la foto. Prueba con otra.");
    } finally {
      setProcessing(false);
      setCropSrc(null);
    }
  }

  function handleRemove() {
    setObjectUrl(null);
    setPreview(null);
    setRemoved(initialUrl !== null);
    if (photoInputRef.current) photoInputRef.current.value = "";
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
        <div className="flex flex-col items-start gap-1.5">
          <label className="btn-ghost cursor-pointer text-xs">
            Hacer foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePick}
              className="hidden"
            />
          </label>
          <label className="btn-ghost cursor-pointer text-xs">
            Elegir de la galería
            <input type="file" accept="image/*" onChange={handlePick} className="hidden" />
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
      {/* Foto ya recortada y comprimida: es la única que se envía. */}
      <input ref={photoInputRef} type="file" name="photo" className="hidden" tabIndex={-1} />
      {removed && <input type="hidden" name="remove_photo" value="1" />}
      {processing && <span className="text-xs text-steel">Procesando foto...</span>}
      {(cropError ?? error) && (
        <span className="text-xs text-red-status">{cropError ?? error}</span>
      )}

      {cropSrc && !processing && (
        <PhotoCropper
          imageSrc={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
