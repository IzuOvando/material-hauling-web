"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { ArrowLeft, Check, Crop as CropIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import whiteLabelConfig from "#/white-label.config";

interface Props {
  imageSrc: string;
  open: boolean;
  onConfirm: (blob: Blob, previewUrl: string) => void;
  onClose: () => void;
}

async function cropToBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelX = Math.round(crop.x * scaleX);
  const pixelY = Math.round(crop.y * scaleY);
  const pixelW = Math.round(crop.width * scaleX);
  const pixelH = Math.round(crop.height * scaleY);

  const canvas = document.createElement("canvas");
  canvas.width = pixelW;
  canvas.height = pixelH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable.");

  ctx.drawImage(image, pixelX, pixelY, pixelW, pixelH, 0, 0, pixelW, pixelH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png"
    );
  });
}

export default function LogoCropModal({ imageSrc, open, onConfirm, onClose }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);

  const [crop, setCrop] = useState<Crop>({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);

  const handleImageLoad = useCallback(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
      setCompletedCrop({ unit: "px", x: 0, y: 0, width, height });
    }
  }, []);

  const handlePreview = async () => {
    if (!imgRef.current || !completedCrop) return;
    setProcessing(true);
    try {
      const blob = await cropToBlob(imgRef.current, completedCrop);
      const url = URL.createObjectURL(blob);
      if (preview?.url) URL.revokeObjectURL(preview.url);
      setPreview({ url, blob });
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    onConfirm(preview.blob, preview.url);
    resetState();
  };

  const handleClose = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    resetState();
    onClose();
  };

  const resetState = () => {
    setPreview(null);
    setCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
    setCompletedCrop(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{whiteLabelConfig.ui.logoCrop.title}</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              {whiteLabelConfig.ui.logoCrop.instructions}
            </p>

            <div className="flex max-h-72 items-center justify-center overflow-auto rounded-md bg-muted/20">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                minWidth={10}
                minHeight={10}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Logo a recortar"
                  className="max-h-72 max-w-full object-contain"
                  onLoad={handleImageLoad}
                />
              </ReactCrop>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                {whiteLabelConfig.ui.logoCrop.cancel}
              </Button>
              <Button
                size="sm"
                onClick={handlePreview}
                disabled={processing || !completedCrop}
                className="bg-secondary hover:bg-secondary/90 text-white"
              >
                {processing ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CropIcon className="mr-1.5 h-3.5 w-3.5" />
                )}
                {processing ? whiteLabelConfig.ui.logoCrop.processing : whiteLabelConfig.ui.logoCrop.previewResult}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted-foreground self-start">
              {whiteLabelConfig.ui.logoCrop.savedPreview}
            </p>

            <div className="flex items-center justify-center rounded-lg border bg-muted/10 p-4 shadow-sm">
              <img
                src={preview.url}
                alt="Preview del logo recortado"
                className="max-h-56 max-w-full object-contain"
              />
            </div>

            <div className="flex w-full justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (preview?.url) URL.revokeObjectURL(preview.url);
                  setPreview(null);
                }}
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Volver
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
