import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireDashboardAccess } from "@/auth/guards";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";

const BCRYPT_SALT_ROUNDS = 12;
const ALLOWED_ROLES = ["user", "admin"] as const;

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireDashboardAccess();

    if (currentUser.role !== "owner") {
      logSecurityEvent({
        type: SecurityEventType.USER_CREATION_DENIED,
        userId: currentUser.name ?? undefined,
        resource: "/api/user",
        details: { reason: "insufficient_role", role: currentUser.role },
      });
      return NextResponse.json(
        { message: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { username, password, rol, nombre, apPaterno, apMaterno, noEmpleado } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Required attributes username & password" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password length should be more than 6 characters" },
        { status: 400 }
      );
    }

    if (!rol || !ALLOWED_ROLES.includes(rol)) {
      return NextResponse.json(
        { message: "Invalid role. Allowed values: user, admin" },
        { status: 400 }
      );
    }

    if (!nombre || !apPaterno || !noEmpleado) {
      return NextResponse.json(
        { message: "Required attributes: nombre, apPaterno, noEmpleado" },
        { status: 400 }
      );
    }

    // Password arrives as SHA256 from the client
    // We hash it with bcrypt for secure storage
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        rol,
        nombre,
        apPaterno,
        apMaterno: apMaterno ?? null,
        noEmpleado,
      },
    });

    logSecurityEvent({
      type: SecurityEventType.USER_CREATED,
      userId: currentUser.name ?? undefined,
      resource: "/api/user",
      details: { createdUser: user.username, role: user.rol },
    });

    return NextResponse.json({ username: user.username }, { status: 201 });
  } catch (ex) {
    if (ex instanceof Prisma.PrismaClientKnownRequestError)
      if (ex.code === "P2002")
        return NextResponse.json(
          { message: "Username already exists" },
          { status: 400 }
        );

    console.error(ex);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
