import { NextRequest, NextResponse } from "next/server";
import { getAllTrucksForExport, buildTrucksExcel } from "@/actions/trucks";
import { getAppUser } from "@/auth/auth.user";

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { frente?: string; filters?: string; sort?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { frente, filters, sort } = body;
  if (!frente) {
    return NextResponse.json({ error: "Required field: frente" }, { status: 400 });
  }

  const isPrivileged = user.role === "owner" || user.role === "general";
  if (!isPrivileged && !user.frentes.includes(frente)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const vouchers = await getAllTrucksForExport(frente, filters, sort);
    const buffer = await buildTrucksExcel(vouchers);
    const filename = `${frente}_vouchers_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to build trucks Excel", error);
    return NextResponse.json(
      { error: "Failed to generate Excel" },
      { status: 500 }
    );
  }
}
