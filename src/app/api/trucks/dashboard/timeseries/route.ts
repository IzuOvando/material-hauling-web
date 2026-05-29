import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/auth/auth.user";
import { getDashboardTimeseries } from "@/actions/dashboard";
import { parsePeriodFromParams, periodIncludesToday } from "@/actions/dashboard/helpers";

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
  const material = searchParams.get("material") ?? undefined;

  if (!frente) {
    return NextResponse.json({ error: "El frente no puede estar vacío." }, { status: 400 });
  }

  if (user.role === "admin" && !user.frentes.includes(frente)) {
    return NextResponse.json({ error: "Sin autorización para este frente." }, { status: 403 });
  }

  let period;
  try {
    period = parsePeriodFromParams(searchParams);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Parámetros de período inválidos." },
      { status: 400 }
    );
  }

  try {
    const data = await getDashboardTimeseries(frente, period, material);
    return NextResponse.json(data, {
      headers: { "Cache-Control": `public, s-maxage=${periodIncludesToday(period) ? 60 : 300}` },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al obtener datos." },
      { status: 400 }
    );
  }
}
