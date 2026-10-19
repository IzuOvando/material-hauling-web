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

    // Fetch active origenes for all user's frentes in one query
    const assignments = await prisma.origenFrente.findMany({
      where: {
        frenteNombre: { in: frenteNombres },
        origen: { isActive: true },
      },
      include: {
        origen: { select: { nombre: true } },
      },
      orderBy: { origen: { nombre: "asc" } },
    });

    // Group by frente
    const origenes: Record<string, string[]> = {};
    for (const frenteNombre of frenteNombres) {
      origenes[frenteNombre] = [];
    }
    for (const assignment of assignments) {
      origenes[assignment.frenteNombre].push(assignment.origen.nombre);
    }

    return NextResponse.json({ origenes });
  } catch (error) {
    console.error("Error al obtener orígenes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
