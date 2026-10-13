import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (user.role !== "owner") {
    return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
  }


    try {
        const { nombre, tipoProyecto, enableTiroCatalog } = await req.json();

        if (tipoProyecto && !["LINEAL", "FIJO"].includes(tipoProyecto)) {
            return NextResponse.json({ error: "Invalid tipoProyecto value" }, { status: 400 });
        }

        if (enableTiroCatalog !== undefined && typeof enableTiroCatalog !== "boolean") {
            return NextResponse.json({ error: "Invalid enableTiroCatalog value" }, { status: 400 });
        }

        const frente = await prisma.frente.create({
            data: {
                nombre,
                ...(tipoProyecto && { tipoProyecto }),
                ...(typeof enableTiroCatalog === "boolean" && { enableTiroCatalog }),
            },
        });

        return NextResponse.json(
            { frente },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: "Ese frente ya existe." },
                    { status: 409 }
                );
            }
        }

        console.error("Error creating frente:", error);
        return NextResponse.json(
            { error: "No se pudo crear el nuevo frente." },
            { status: 500 }
        );
    }
}