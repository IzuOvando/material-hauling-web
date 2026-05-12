"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getMetadataCamionFromFile } from "@/utils/excel/excelValidatorQRs";
import { getCamionesQRSVG } from "@/utils/excel/generatorDownloadQrs";
import { cn } from "@/lib/utils";

const ACCEPT = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-excel": [".xls"],
};

export default function QRPage() {
  const { toast } = useToast();
  const [lastFile, setLastFile] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      getMetadataCamionFromFile(file)
        .then((meta) => {
          getCamionesQRSVG(meta);
          setLastFile(file.name);
          toast({
            title: "Generación exitosa",
            description: "Tus QRs están en el archivo ZIP descargado.",
            variant: "success",
            duration: 3000,
          });
        })
        .catch((err: Error) => {
          toast({
            title: "Archivo inválido",
            description: err.message,
            variant: "destructive",
            duration: 3000,
          });
        });
    },
    [toast],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length === 0) {
        toast({
          title: "Archivo incorrecto",
          description: "Asegúrese de que sea un archivo Excel (.xlsx) válido.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      processFile(accepted[0]);
    },
    [processFile, toast],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: false,
    noClick: true,
  });

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h2 className="text-2xl font-semibold">Generador de QRs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Carga una hoja de cálculo con datos de camiones para generar sus QRs
          en un archivo ZIP.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-10 text-center",
          "transition-all duration-200 cursor-default",
          isDragActive
            ? "border-secondary bg-secondary/5 scale-[1.01]"
            : "border-secondary/30 bg-white hover:border-secondary/60 hover:bg-secondary/[0.02]",
        )}
      >
        <input {...getInputProps()} />

        {/* Drag-active overlay */}
        {isDragActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-secondary/10 backdrop-blur-[1px] z-10">
            <UploadCloud className="h-14 w-14 text-secondary mb-3 animate-bounce" />
            <p className="text-lg font-semibold text-secondary">Suelta aquí</p>
          </div>
        )}

        {/* Normal state */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-secondary/10 scale-150 blur-xl" />
            <FileSpreadsheet className="relative h-12 w-12 text-secondary/60" />
          </div>

          {lastFile ? (
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="truncate max-w-[260px]">{lastFile}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Arrastra &amp; suelta tu archivo Excel
            </p>
          )}

          <button
            type="button"
            onClick={open}
            className={cn(
              "mt-1 px-5 py-2 rounded-lg text-sm font-semibold text-white",
              "bg-secondary hover:bg-secondary-light active:bg-secondary-dark",
              "transition-colors duration-150 shadow-sm",
            )}
          >
            {lastFile ? "Cargar otro archivo" : "Seleccionar archivo XLSX"}
          </button>
        </div>
      </div>

      {/* Template download */}
      <div className="mt-5 flex justify-center">
        <a
          href="/documents/test_metadatacamion.xlsx"
          download="test_metadatacamion.xlsx"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors group"
        >
          <Download className="h-4 w-4 group-hover:text-accent transition-colors" />
          Descargar template de ejemplo
        </a>
      </div>
    </div>
  );
}
