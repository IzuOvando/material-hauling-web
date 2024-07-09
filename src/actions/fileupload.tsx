import { Dispatch, SetStateAction } from "react";
import { handleDeleteFiles } from "@/actions/deletefiles";

export async function handleFileUpload(
  frente: any,
  file: File,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  toast: any,
  apiUrl: string
) {
  setIsLoading(true);
  const newFileName = `bbd_${frente.nombre}.xlsx`;
  const newFile = new File([file], newFileName, { type: file.type });
  const formData = new FormData();
  formData.append("file", newFile);

  try {
    const uploadResponse = await fetch(`${apiUrl}/api/files`, {
      method: "POST",
      body: formData,
    });

    if (uploadResponse.ok) {
      const processResponse = await fetch(`${apiUrl}/api/files/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: newFile.name }),
      });

      if (processResponse.ok) {
        toast({
          title: "Success",
          description: "Archivo subido y procesado exitosamente",
          variant: "success",
        });
        setTimeout(() => window.location.reload(), 2500);
      } else {
        const { success, errorMessage } = await handleDeleteFiles(
          frente,
          setIsLoading,
          toast,
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        );

        if (!success) {
          console.error("Error deleting files:", errorMessage);
          return;
        }

        const processErrorText = await processResponse.text();
        toast({
          title: "Error",
          description: `Error al procesar archivo: Campos incorrectos o formato no válido.`,
          variant: "destructive",
        });
        console.log(processErrorText);
      }
    } else {
      const uploadErrorText = await uploadResponse.text();
      toast({
        title: "Error",
        description: `Error al subir archivo: ${uploadErrorText}`,
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
