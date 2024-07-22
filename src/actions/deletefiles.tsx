import { Dispatch, SetStateAction } from 'react';

export async function handleDeleteFiles(
    area: string,
    selectedFrente: any,
    setIsLoading: Dispatch<SetStateAction<boolean>>,
    toast: any,
    apiUrl: string
) {
    setIsLoading(true);

    const FileName = selectedFrente.nombre

    try {
        const response = await fetch(`${apiUrl}/api/files/update`, {
            method: 'POST',
            body: JSON.stringify({ nombre: FileName, area: area }),
        });

        if (response.ok) {
            return { success: true };
        } else {
            const errorText = await response.text();
            toast({
                title: "Error",
                description: `Failed to delete files or data: ${errorText}`,
                variant: "destructive"
            });
            return { success: false, errorMessage: errorText };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        toast({
            title: "Error",
            description: `Error while making request: ${errorMessage}`,
            variant: "destructive"
        });
        return { success: false, errorMessage };
    }
}