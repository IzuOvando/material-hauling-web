import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { NextRequest, NextResponse } from "next/server";

const MAX_FOLIOS = 100;

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (user.role !== "owner") {
    return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { folios } = body as { folios?: unknown };

  if (!Array.isArray(folios) || folios.length === 0) {
    return NextResponse.json(
      { error: "Se requiere un arreglo de folios." },
      { status: 400 }
    );
  }

  if (folios.length > MAX_FOLIOS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_FOLIOS} folios por operación.` },
      { status: 400 }
    );
  }

  if (folios.some((f) => typeof f !== "string")) {
    return NextResponse.json(
      { error: "Todos los folios deben ser strings." },
      { status: 400 }
    );
  }

  const uniqueFolios = [...new Set(folios as string[])];

  const tickets = await prisma.voucherCamion.findMany({
    where: { folio: { in: uniqueFolios } },
    select: {
      folio: true,
      status: true,
      frenteNombre: true,
      placas: true,
      material: true,
      voucherDatetime: true,
      operador: true,
      odometer: true,
    },
  });

  const foundFolios = new Set(tickets.map((t) => t.folio));
  const notFound = uniqueFolios.filter((f) => !foundFolios.has(f));
  const found = tickets.filter((t) => t.status === "IN_TRANSIT");
  const alreadyClosed = tickets.filter((t) => t.status === "ARRIVED");

  return NextResponse.json({ found, alreadyClosed, notFound });
}
