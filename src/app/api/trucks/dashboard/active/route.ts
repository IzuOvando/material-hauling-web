import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { getAppUser } from "@/auth/auth.user";
import CONFIG from "@/config";
import prisma from "@/lib/db";
import type { ActiveResponse } from "@/types/dashboard";

export async function GET(req: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (user.role === "user") {
    return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const frente = searchParams.get("frente")?.trim() ?? "";

  if (!frente) {
    return NextResponse.json({ error: "El frente no puede estar vacío." }, { status: 400 });
  }

  if (user.role === "admin" && !user.frentes.includes(frente)) {
    return NextResponse.json({ error: "Sin autorización para este frente." }, { status: 403 });
  }

  try {
    const todayStart = DateTime.now()
      .setZone(CONFIG.TIMEZONE)
      .startOf("day")
      .toJSDate();

    const inTransitNow = await prisma.voucherCamion.count({
      where: {
        frenteNombre: frente,
        status: "IN_TRANSIT",
        voucherDatetime: { gte: todayStart },
      },
    });

    const response: ActiveResponse = { inTransitNow };
    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=30" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al obtener datos." },
      { status: 500 }
    );
  }
}
