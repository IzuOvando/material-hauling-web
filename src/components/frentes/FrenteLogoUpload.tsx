"use client";

import { useRef, useState } from "react";
import { Crop, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Frente } from "@prisma/client";
import { normalizeFrenteKey } from "@/utils/normalizeFrenteKey";
import LogoCropModal from "@/components/frentes/LogoCropModal";
import whiteLabelConfig from "../../../white-label.config";

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg"];

interface Props {
  frente: Frente;
  onLogoUpdated: () => void;
}

export default function FrenteLogoUpload({ frente, onLogoUpdated }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [preview, setPreview] = useState<string | null>(frente.logoUrl ?? null);
  const [pendingFile, setPendingFile] = useState<{ src: string; file: File } | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setValidationError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError("Solo se aceptan archivos PNG o JPEG.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setValidationError(
        `Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). El máximo es 5 MB.`
      );
      return;
    }

    setPendingFile({ src: URL.createObjectURL(file), file });
  };

  const handleDirectUpload = () => {
    if (!pendingFile) return;
    setPendingBlob(pendingFile.file);
    setPendingPreviewUrl(pendingFile.src);
    setPendingFile(null);
  };

  const handleOpenCrop = () => {
    if (!pendingFile) return;
    setCropSrc(pendingFile.src);
    setPendingFile(null);
  };

  const handleCancelPendingFile = () => {
    if (pendingFile?.src) URL.revokeObjectURL(pendingFile.src);
    setPendingFile(null);
    setValidationError(null);
  };

  const handleCropConfirm = (blob: Blob, previewUrl: string) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingBlob(blob);
    setPendingPreviewUrl(previewUrl);
  };

  const handleCropClose = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const handleConfirmUpload = async () => {
    if (!pendingBlob) return;
    setLoading(true);
    const frenteKey = normalizeFrenteKey(frente.nombre);

    try {
      const res = await fetch(`/api/frentes/${frenteKey}/logo`, {
        method: "POST",
        headers: {
          "Content-Type": "image/png",
          "X-Frente-Nombre": frente.nombre,
        },
        body: pendingBlob,
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error al subir",
          description: data.error ?? "Error desconocido.",
          variant: "destructive",
        });
        return;
      }

      setPreview(data.logoUrl);
      setPendingBlob(null);
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
      setPendingPreviewUrl(null);
      toast({
        title: "Logo actualizado",
        description: `Logo del frente ${frente.nombre} guardado correctamente.`,
        variant: "success",
      });
      onLogoUpdated();
    } catch {
      toast({
        title: "Error al subir",
        description: "Error de red. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPending = () => {
    setPendingBlob(null);
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingPreviewUrl(null);
    setValidationError(null);
  };

  const activeImage = pendingPreviewUrl ?? pendingFile?.src ?? preview;
  const isDeciding = !!pendingFile;
  const isReadyToUpload = !!pendingBlob && !!pendingPreviewUrl;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{whiteLabelConfig.ui.frentesManager.logo.heading}</span>
        <span className="text-xs text-muted-foreground">{whiteLabelConfig.ui.frentesManager.logo.formatHint}</span>
      </div>

      <button
        type="button"
        onClick={() => !loading && !isDeciding && !isReadyToUpload && fileInputRef.current?.click()}
        disabled={loading || isDeciding || isReadyToUpload}
        className={[
          "group relative w-full rounded-xl border-2 border-dashed transition-all duration-200",
          "flex flex-col items-center justify-center gap-2 py-5",
          "shadow-sm hover:shadow-md",
          isDeciding || isReadyToUpload
            ? "border-accent/40 bg-accent/5 cursor-default"
            : activeImage
            ? "border-muted hover:border-accent/50 hover:bg-accent/5 cursor-pointer bg-muted/20"
            : "border-muted hover:border-accent/60 hover:bg-accent/5 cursor-pointer bg-muted/10",
        ].join(" ")}
      >
        {activeImage ? (
          <div className="relative flex items-center justify-center">
            <img
              src={activeImage}
              alt="Frente logo"
              className="h-24 w-24 rounded-lg object-contain shadow-sm"
            />
            {!isDeciding && !isReadyToUpload && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
                <Upload className="h-5 w-5 text-white" />
                <span className="mt-1 text-xs font-medium text-white">{whiteLabelConfig.ui.frentesManager.logo.replace}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground transition-colors group-hover:text-accent">
            <div className="rounded-full border-2 border-dashed border-current p-3 transition-colors">
              <ImageIcon className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">{whiteLabelConfig.ui.frentesManager.logo.uploadPrompt}</span>
          </div>
        )}

        {isDeciding && (
          <span className="text-xs text-muted-foreground">{whiteLabelConfig.ui.frentesManager.logo.cropPrompt}</span>
        )}
        {isReadyToUpload && (
          <span className="text-xs text-muted-foreground">{whiteLabelConfig.ui.frentesManager.logo.previewPrompt}</span>
        )}
      </button>

      {isDeciding && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenCrop}
            className="flex flex-1 items-center justify-center gap-1.5"
          >
            <Crop className="h-3.5 w-3.5" />
            {whiteLabelConfig.ui.frentesManager.logo.crop}
          </Button>
          <Button
            size="sm"
            onClick={handleDirectUpload}
            className="flex flex-1 items-center justify-center gap-1.5 bg-secondary hover:bg-secondary-dark text-white"
          >
            <Upload className="h-3.5 w-3.5" />
            {whiteLabelConfig.ui.frentesManager.logo.uploadImage}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelPendingFile}
            className="px-2"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {isReadyToUpload && (
        <div className="flex flex-col gap-2">
          {preview && (
            <p className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
              ⚠️ El logo actual será reemplazado al confirmar. Esta acción no se puede deshacer.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleConfirmUpload}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {loading ? "Subiendo…" : "Confirmar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelPending}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {validationError && (
        <p className="text-xs font-medium text-red-500">{validationError}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      <LogoCropModal
        imageSrc={cropSrc ?? ""}
        open={!!cropSrc}
        onConfirm={handleCropConfirm}
        onClose={handleCropClose}
      />
    </div>
  );
}
