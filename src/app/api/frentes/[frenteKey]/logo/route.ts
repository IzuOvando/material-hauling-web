import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import blobClient from "@/lib/blobClient";
import { normalizeFrenteKey } from "@/utils/normalizeFrenteKey";

const MAX_SIZE_BYTES = 500 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg"];

export async function POST(
  req: NextRequest,
  { params }: { params: { frenteKey: string } }
) {
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

  if (buffer.byteLength > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is 500 KB.` },
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

  const logoHash = createHash("sha256").update(buffer).digest("hex");

  const ext = mimeType === "image/png" ? "png" : "jpg";
  const blobPathname = `logos/${frenteKey}.${ext}`;

  let newLogoUrl: string;
  try {
    const result = await blobClient.putBlob(blobPathname, buffer, {
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
