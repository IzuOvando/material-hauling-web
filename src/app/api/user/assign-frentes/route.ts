import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireDashboardAccess } from "@/auth/guards";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await requireDashboardAccess();

    if (user.role !== "owner") {
      return NextResponse.json(
        { message: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { username, add = [], remove = [] } = await req.json();

    await prisma.user.update({
      where: { username },
      data: {
        frentes: {
          create: add.map((frenteNombre: string) => ({
            frenteNombre,
          })),
          deleteMany: {
            frenteNombre: { in: remove },
          },
        },
      },
    });

    logSecurityEvent({
      type: SecurityEventType.PERMISSION_CHANGE,
      userId: user.name ?? undefined,
      resource: "/api/user/assign-frentes",
      details: { targetUser: username, added: add, removed: remove },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("❌ Error:", error.message);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta as any)?.target;
        const isUserFrenteUnique =
          Array.isArray(target) &&
          target.includes("userId") &&
          target.includes("frenteNombre");

        return NextResponse.json(
          {
            message: "DUPLICATE_FRENTE",
            detail: isUserFrenteUnique
              ? "Este frente ya está asignado a este usuario."
              : "Violación de restricción única.",
          },
          { status: 409 }
        );
      }
    }

    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { message: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
