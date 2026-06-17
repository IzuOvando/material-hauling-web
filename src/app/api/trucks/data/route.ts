import { NextRequest, NextResponse } from "next/server";
import { getTrucksData } from "@/actions/trucks";
import { getAppUser } from "@/auth/auth.user";
import CONFIG from "@/config";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const frente = params.get("frente");
  const filters = params.get("filters") || undefined;
  const sort = params.get("sort") || undefined;
  const page = Number(params.get("page")) || CONFIG.PAGINATION.DEFAULT_PAGE;
  const limit = Number(params.get("limit")) || CONFIG.PAGINATION.DEFAULT_LIMIT;

  if (!frente) {
    return NextResponse.json(
      { error: "Required param frente" },
      { status: 400 }
    );
  }

  const user = await getAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isPrivileged = user.role === "owner" || user.role === "general";
  if (!isPrivileged && !user.frentes.includes(frente)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const response = await getTrucksData(frente, filters, { page, limit }, sort);
    if (!response) {
      return NextResponse.json({ error: "Frente not found" }, { status: 404 });
    }
    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to get trucks data", error);
    return NextResponse.json(
      { error: "Failed to get trucks data" },
      { status: 500 }
    );
  }
}
