"use client";
import { FileDroper } from "@/components/common";
import { useToast } from "@/components/ui/use-toast";
import { getMetadataCamionFromFile } from "@/utils/excel/excelValidatorQRs";
import { getCamionesQRSVG } from "@/utils/excel/generatorDownloadQrs";

export default function QRPage() {
  const { toast } = useToast();

  const onFileChange = (files: File[]) => {
    if (files.length === 0) {
      toast({
        title: "Archivo Incorrecto",
        description: "Asegúrese de que sea un archivo Excel (.xlsx) válido.",
        variant: "destructive",
        duration: 3000,
      });
    }

    transformFile(files[0]);
  };

  const transformFile = (file: File) => {
    getMetadataCamionFromFile(file)
      .then((metadataCamiones) => {
        getCamionesQRSVG(metadataCamiones);
        toast({
          title: "Generación Exitosa",
          description: "Podrás encontrar tus QRs en el archivo ZIP descargado.",
          variant: "success",
          duration: 3000,
        });
      })
      .catch((error) => {
        toast({
          title: "Archivo Inválido",
          description: error.message,
          variant: "destructive",
          duration: 3000,
        });
        console.error(error);
      });
  };

  return (
    <main className="container my-10">
      <div className="container mx-auto p-4 max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-2">QR Generator</h1>
        <p className="text-center text-muted-foreground mb-6">
          Ingresa una hoja de cálculo con datos de camiones para poder generar
          sus respectivos QRs.
        </p>
        <FileDroper
          description="Arrastra & suelta tu archivo Excel"
          buttonText="Selecciona archivo XLSX"
          dropzoneText="Suelta aquí"
          accept={{
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
          }}
          onFileChange={onFileChange}
        />
      </div>
    </main>
  );
}
