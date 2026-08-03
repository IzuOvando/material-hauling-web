import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import prisma from "@/lib/db";
import blobClient from "@/lib/blobClient";
import { getAppUser } from "@/auth/auth.user";
import { normalizeFrenteKey } from "@/utils/normalizeFrenteKey";

const MAX_INPUT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit on raw input
const ALLOWED_TYPES = ["image/png", "image/jpeg"];
const LOGO_MAX_WIDTH = 500;

export async function POST(
  req: NextRequest,
  { params }: { params: { frenteKey: string } }
) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (user.role !== "owner") {
    return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
  }

  const frenteKey = normalizeFrenteKey(params.frenteKey);

  const contentType = req.headers.get("content-type") ?? "";
  const mimeType = contentType.split(";")[0].trim();
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { error: "Invalid file type. Only PNG and JPEG are allowed." },
      { status: 400 }
    );
  }

  const arrayBuffer = await req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > MAX_INPUT_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum input size is 10 MB.` },
      { status: 400 }
    );
  }

  const frenteNombre = req.headers.get("x-frente-nombre");

  const frente = frenteNombre
    ? await prisma.frente.findUnique({ where: { nombre: frenteNombre } })
    : await prisma.frente.findFirst({ where: { frenteKey } });

  if (!frente) {
    return NextResponse.json(
      { error: `Frente with key "${frenteKey}" not found.` },
      { status: 404 }
    );
  }

  let resizedBuffer: Buffer;
  try {
    resizedBuffer = await sharp(buffer)
      .resize({ width: LOGO_MAX_WIDTH, withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch (err) {
    console.error("Failed to resize logo:", err);
    return NextResponse.json(
      { error: "Invalid or corrupted image file." },
      { status: 400 }
    );
  }

  const logoHash = createHash("sha256").update(resizedBuffer).digest("hex");

  const blobPathname = `logos/${frenteKey}.png`;

  let newLogoUrl: string;
  try {
    const result = await blobClient.putBlob(blobPathname, resizedBuffer, {
      access: "public",
    });
    newLogoUrl = result.url;
  } catch (err) {
    console.error("Failed to upload logo to Vercel Blob:", err);
    return NextResponse.json(
      { error: "Failed to upload logo. Please try again." },
      { status: 500 }
    );
  }

  if (frente.logoUrl) {
    try {
      await blobClient.deleteBlob(frente.logoUrl);
    } catch (err) {
      console.error("Failed to delete previous logo blob:", err, frente.logoUrl);
    }
  }

  try {
    await prisma.frente.updateMany({
      where: { frenteKey, nombre: { not: frente.nombre } },
      data: { frenteKey: null },
    });

    await prisma.frente.update({
      where: { nombre: frente.nombre },
      data: { frenteKey, logoUrl: newLogoUrl, logoHash, logoUpdatedAt: new Date() },
    });
  } catch (err) {
    console.error("Failed to save logo metadata to DB:", err);
    return NextResponse.json(
      { error: "Logo uploaded but failed to save metadata. Contact support." },
      { status: 500 }
    );
  }

  revalidatePath("/", "layout");

  return NextResponse.json(
    { frenteKey, logoUrl: newLogoUrl, logoHash },
    { status: 200 }
  );
}
