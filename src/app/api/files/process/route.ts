import { NextRequest, NextResponse } from "next/server";
import FileProcessor from '@/actions/convert';

export const config = {
    api: {
        bodyParser: false, // Asegúrate de ajustar esto según necesites manejar el cuerpo de la solicitud
    },
};

export async function POST(req: NextRequest) {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
            status: 405,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    try {
        const fileProcessor = new FileProcessor();
        await fileProcessor.processFiles(); // Asegúrate de que esto está correctamente sincronizado con tus necesidades de archivos

        return new Response(JSON.stringify({ message: "Files processed successfully" }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: `Failed to process files: ${errorMessage}` }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
