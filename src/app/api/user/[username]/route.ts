import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireDashboardAccess } from "@/auth/guards";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";

const ALLOWED_ROLES = ["user", "admin"] as const;

export async function PUT(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const currentUser = await requireDashboardAccess();

    if (currentUser.role !== "owner") {
      return NextResponse.json({ message: "FORBIDDEN" }, { status: 403 });
    }

    const { username } = params;
    const { nombre, apPaterno, apMaterno, noEmpleado, rol } = await req.json();

    if (!nombre || !apPaterno || !noEmpleado) {
      return NextResponse.json(
        { message: "Required attributes: nombre, apPaterno, noEmpleado" },
        { status: 400 }
      );
    }

    if (!rol || !ALLOWED_ROLES.includes(rol)) {
      return NextResponse.json(
        { message: "Invalid role. Allowed values: user, admin" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { username },
      data: {
        nombre,
        apPaterno,
        apMaterno: apMaterno ?? null,
        noEmpleado,
        rol,
      },
      select: {
        username: true,
        rol: true,
        nombre: true,
        apPaterno: true,
        apMaterno: true,
        noEmpleado: true,
      },
    });

    logSecurityEvent({
      type: SecurityEventType.DATA_UPDATE,
      userId: currentUser.name ?? undefined,
      resource: `/api/user/${username}`,
      details: { updatedUser: username },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }
    }
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const currentUser = await requireDashboardAccess();

    if (currentUser.role !== "owner") {
      return NextResponse.json({ message: "FORBIDDEN" }, { status: 403 });
    }

    const { username } = params;

    await prisma.user.delete({
      where: { username },
    });

    logSecurityEvent({
      type: SecurityEventType.DATA_DELETE,
      userId: currentUser.name ?? undefined,
      resource: `/api/user/${username}`,
      details: { deletedUser: username },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }
    }
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
