import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma, VoucherCamion as PrismaVoucherCamion } from "@prisma/client";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken || !TokenAuthenticator.verify(accessToken)) {
      return NextResponse.json({ message: "No autorizado, proporcione credenciales válidas para realizar esta acción" }, { status: 401 });
    }

    const decoded = TokenAuthenticator.decode(accessToken);
    if (!decoded) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");

    let limit = 5;

    if (limitParam !== null) {
      const parsedLimit = parseInt(limitParam, 10);

      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return NextResponse.json(
          { message: "El límite debe tener un valor entre 1 y 50" },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    const { role, username } = decoded;
    let whereClause: Prisma.VoucherCamionWhereInput = {};

    if (role !== "owner" && role !== "general") {
      const userRecord = await prisma.user.findUnique({
        where: { username },
        include: { frentes: true },
      });

      const userFrentes = userRecord?.frentes.map((f) => f.frenteNombre) ?? [];
      whereClause = { frenteNombre: { in: userFrentes } };

      if (role === "user") {
        whereClause = {
          ...whereClause,
          OR: [
            { createdByUsername: username },
            { arrivalCreatedByUsername: username },
          ],
        };
      }
    }

    const vouchers: PrismaVoucherCamion[] = await prisma.voucherCamion.findMany({
      where: whereClause,
      orderBy: { voucherDatetime: "desc" },
      take: limit,
    });

    const formattedVouchers = vouchers.map((voucher) => ({
      ...voucher,
      voucherTime: voucher.voucherDatetime.toISOString(),
      createdAt: voucher.createdAt.toISOString(),
      arrivalTime: voucher.arrivalTime?.toISOString() ?? null,
    }));

    return NextResponse.json(formattedVouchers);
  } catch (error) {
    console.error("Error al recuperar los vouchers:", error);
    return NextResponse.json(
      { message: "Ocurrió un error al recuperar los vouchers" },
      { status: 500 }
    );
  }
}
