import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireDashboardAccess } from "@/auth/guards";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";

const BCRYPT_SALT_ROUNDS = 12;

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
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { message: "Required attribute: password" },
        { status: 400 }
      );
    }

    // Password arrives as SHA256 from the client
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    await prisma.user.update({
      where: { username },
      data: { password: hashedPassword },
    });

    logSecurityEvent({
      type: SecurityEventType.DATA_UPDATE,
      userId: currentUser.name ?? undefined,
      resource: `/api/user/${username}/password`,
      details: { updatedUser: username, action: "password_reset" },
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
