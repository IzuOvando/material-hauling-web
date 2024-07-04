import { Dispatch, SetStateAction } from 'react';

export async function handleFileUpload(
    file: File,
    setFileName: Dispatch<SetStateAction<string | null>>,
    setIsLoading: Dispatch<SetStateAction<boolean>>,
    toast: any,
    apiUrl: string,
) {
    const newFile = new File([file], "bbd.xlsx", { type: file.type });

    setFileName(newFile.name);

    const formData = new FormData();
    formData.append('file', newFile);

    try {
        const uploadResponse = await fetch(`${apiUrl}/api/files`, {
            method: 'POST',
            body: formData,
        });

        if (uploadResponse.ok) {
            const processResponse = await fetch(`${apiUrl}/api/files/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fileName: newFile.name }),
            });

            if (processResponse.ok) {
                toast({
                    title: "Success",
                    description: "Archivo subido y procesado exitosamente",
                    variant: "success"
                });
                setTimeout(() => window.location.reload(), 3000);
            } else {
                const processErrorText = await processResponse.text();
                toast({
                    title: "Error",
                    description: `Error al procesar archivo: ${processErrorText}`,
                    variant: "destructive"
                });
            }
        } else {
            const uploadErrorText = await uploadResponse.text();
            toast({
                title: "Error",
                description: `Error al subir archivo: ${uploadErrorText}`,
                variant: "destructive"
            });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
            title: "Error",
            description: `Error al realizar la solicitud: ${errorMessage}`,
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
}
