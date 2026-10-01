"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/Button";

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (area: Area, rotation: number) => void;
};

/**
 * Editor a pantalla completa para encuadrar la pieza: recorte cuadrado, zoom
 * y rotación (con los deslizadores o con gestos de dos dedos en el móvil).
 */
export function PhotoCropper({ imageSrc, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink"
      role="dialog"
      aria-modal="true"
      aria-label="Recortar foto"
    >
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          maxZoom={4}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>
      <div className="flex flex-col gap-3 border-t border-ink-soft bg-paper px-5 py-4 text-sm">
        <label className="flex items-center gap-3">
          <span className="w-16 text-steel">Zoom</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-brick"
          />
        </label>
        <label className="flex items-center gap-3">
          <span className="w-16 text-steel">Rotación</span>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="flex-1 accent-brick"
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!area}
            onClick={() => area && onConfirm(area, rotation)}
          >
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}
