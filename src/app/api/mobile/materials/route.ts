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

    // Determine frentes based on role
    let frenteNombres: string[];

    if (decoded.role === "owner" || decoded.role === "general") {
      const frentes = await prisma.frente.findMany({
        select: { nombre: true },
      });
      frenteNombres = frentes.map((f) => f.nombre);
    } else {
      // admin/user: only assigned frentes
      const userRecord = await prisma.user.findUnique({
        where: { username: decoded.username },
        include: { frentes: true },
      });
      frenteNombres = userRecord?.frentes.map((f) => f.frenteNombre) ?? [];
    }

    // Fetch active materials for all user's frentes in one query
    const assignments = await prisma.materialFrente.findMany({
      where: {
        frenteNombre: { in: frenteNombres },
        material: { isActive: true },
      },
      include: {
        material: { select: { nombre: true } },
      },
      orderBy: { material: { nombre: "asc" } },
    });

    // Group by frente
    const materials: Record<string, string[]> = {};
    for (const frenteNombre of frenteNombres) {
      materials[frenteNombre] = [];
    }
    for (const assignment of assignments) {
      materials[assignment.frenteNombre].push(assignment.material.nombre);
    }

    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
