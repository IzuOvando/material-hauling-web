import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireDashboardAccess } from "@/auth/guards";

export async function GET() {
  try {
    const currentUser = await requireDashboardAccess();

    if (currentUser.role !== "owner") {
      return NextResponse.json({ message: "FORBIDDEN" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        rol: { not: "owner" },
      },
      select: {
        username: true,
        rol: true,
        nombre: true,
        apPaterno: true,
        apMaterno: true,
        noEmpleado: true,
        frentes: {
          select: { frenteNombre: true },
        },
      },
      orderBy: { username: "asc" },
    });

    const mapped = users.map((u) => ({
      ...u,
      frentes: u.frentes.map((f) => f.frenteNombre),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
