import { Dispatch, SetStateAction } from "react";
import { handleDeleteFiles } from "@/actions/deletefiles";
import CONFIG from "@/config";
import { upload } from '@vercel/blob/client';
import { Frente } from "@prisma/client";

export async function handleFileUpload(
  area: string,
  frente: Frente,
  file: File,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  toast: any,
  onUpload: () => void,
) {
  setIsLoading(true);
  const newFileName = `bbd_${frente.nombre}.xlsx`;
  const newFile = new File([file], newFileName, { type: file.type });
  const nameRoute = `db_input/${newFileName}`;
  const formData = new FormData();
  formData.append("file", newFile);

  const clientPayload = JSON.stringify({
    frenteId: frente.nombre,
    area: area,
  });

  const handleProductionUpload = async () => {
    const response = await upload(nameRoute, newFile, {
      access: 'public',
      handleUploadUrl: '/api/files/vercel',
      clientPayload: clientPayload,
    });

    return {
      blobUrl: response.url,
    };
  };

  const handleDevelopmentUpload = async () => {
    const response = await fetch(`/api/files/local`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    return {
      blobUrl: result.blobUrl,
    };
  };

  try {
    let uploadFunction;

    if (process.env.NODE_ENV === 'production') {
      uploadFunction = handleProductionUpload;
    } else {
      uploadFunction = handleDevelopmentUpload;
    }

    const uploadResponse = await uploadFunction();
    const blobUrl = uploadResponse.blobUrl;

    if (blobUrl) {
      const processResponse = await fetch(`/api/files/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: newFile.name, area: area, excelBlobUrl: blobUrl, }),
      });

      if (processResponse.ok) {
        toast({
          title: "Success",
          description: "Archivo subido y procesado exitosamente",
          variant: "success",
        });
        onUpload();
      } else {
        const { success, errorMessage } = await handleDeleteFiles(
          area,
          frente,
          setIsLoading,
          toast,
          CONFIG.BASE_URL
        );

        if (!success) {
          console.error("Error deleting files:", errorMessage);
          return;
        }
        toast({
          title: "Error",
          description: `Error al procesar archivo: Campos incorrectos o formato no válido.`,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: `Error al subir archivo: No se pudo obtener la URL del blob.`,
        variant: "destructive",
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    toast({
      title: "Error",
      description: `Error al realizar la solicitud: ${errorMessage}`,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
}
