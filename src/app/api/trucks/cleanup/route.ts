import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (user.role !== "owner") {
    return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    await prisma.voucherCamion.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({ message: "Limpieza completada." });
  } catch (error) {
    console.error("Error durante la limpieza:", error);
    return NextResponse.json(
      { error: "Error durante la limpieza." },
      { status: 500 }
    );
  }
}
