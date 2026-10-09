import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken || !TokenAuthenticator.verify(accessToken)) {
      return NextResponse.json(
        { error: "No autorizado, proporcione credenciales válidas para realizar esta acción" },
        { status: 401 }
      );
    }

    const decoded = TokenAuthenticator.decode(accessToken);
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    let frenteNombres: string[] | undefined;

    if (decoded.role !== "owner" && decoded.role !== "general") {
      const userRecord = await prisma.user.findUnique({
        where: { username: decoded.username },
        include: { frentes: true },
      });
      frenteNombres = userRecord?.frentes.map((f) => f.frenteNombre) ?? [];
    }

    const frentes = await prisma.frente.findMany({
      where: frenteNombres ? { nombre: { in: frenteNombres } } : undefined,
      select: { nombre: true, tipoProyecto: true },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ frentes });
  } catch (error) {
    console.error("Error al obtener frentes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
