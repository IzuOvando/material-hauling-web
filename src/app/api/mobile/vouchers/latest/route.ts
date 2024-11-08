import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { VoucherCamion as PrismaVoucherCamion } from "@prisma/client";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";

export async function GET(req: NextRequest) {
  try {

    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken || !TokenAuthenticator.verify(accessToken)) {
      return NextResponse.json({ message: "Unauthorized, provide valid credentials to perform this action" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");

    let limit = 5;
    if (limitParam !== null) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return NextResponse.json(
          { message: "Limit must have a value between 1 and 50" },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    const vouchers: PrismaVoucherCamion[] = await prisma.voucherCamion.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error("Error retrieving vouchers:", error);
    return NextResponse.json(
      { message: "An error occurred while retrieving the vouchers" },
      { status: 500 }
    );
  }
}
