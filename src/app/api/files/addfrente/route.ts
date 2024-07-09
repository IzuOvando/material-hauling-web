import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { nombre } = await req.json();

        const frente = await prisma.frente.create({
            data: { nombre },
        });

        return NextResponse.json(
            { frente },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error al crear nuevo frente:", error);
        return NextResponse.json(
            { error: "No se pudo crear el nuevo frente." },
            { status: 500 }
        );
    }
}
