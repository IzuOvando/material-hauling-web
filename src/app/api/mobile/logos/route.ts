import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";

export const dynamic = "force-dynamic";

type LogoEntry = {
  frenteKey: string;
  url: string;
  hash: string;
};

/**
 * GET /api/mobile/logos
 *
 * Returns the frente logos that the authenticated user is allowed to access.
 *
 * - Users/checkers with assigned frentes → only logos for those frentes.
 * - owner/general roles → empty array. These roles are web-only and are not
 *   expected to print tickets from the mobile app.
 */
export async function GET(req: NextRequest) {

  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader?.split(" ")[1];

  if (!accessToken || !TokenAuthenticator.verify(accessToken)) {
    return NextResponse.json(
      { message: "Unauthorized. Provide valid credentials." },
      { status: 401 }
    );
  }

  const decoded = TokenAuthenticator.decode(accessToken);
  if (!decoded) {
    return NextResponse.json({ message: "Invalid token." }, { status: 401 });
  }

  const { username, role } = decoded;

  if (role === "owner" || role === "general") {
    return NextResponse.json([] satisfies LogoEntry[], { status: 200 });
  }

  const userRecord = await prisma.user.findUnique({
    where: { username },
    include: { frentes: true },
  });

  const assignedFrenteNames = userRecord?.frentes.map((f) => f.frenteNombre) ?? [];

  if (assignedFrenteNames.length === 0) {
    return NextResponse.json([] satisfies LogoEntry[], { status: 200 });
  }

  const frentesWithLogos = await prisma.frente.findMany({
    where: {
      nombre: { in: assignedFrenteNames },
      frenteKey: { not: null },
      logoUrl: { not: null },
      logoHash: { not: null },
    },
    select: {
      frenteKey: true,
      logoUrl: true,
      logoHash: true,
    },
  });

  const logos: LogoEntry[] = frentesWithLogos
    .filter(
      (f): f is { frenteKey: string; logoUrl: string; logoHash: string } =>
        f.frenteKey !== null && f.logoUrl !== null && f.logoHash !== null
    )
    .map((f) => ({
      frenteKey: f.frenteKey,
      url: f.logoUrl,
      hash: f.logoHash,
    }));

  return NextResponse.json(logos, { status: 200 });
}
