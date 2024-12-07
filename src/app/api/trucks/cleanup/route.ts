import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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
