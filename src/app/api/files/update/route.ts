import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import blobClient from "@/lib/blobClient";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const data = await req.json();
  const { frente, area } = data;

  const foundFrente = await prisma.frente.findUnique({
    where: { nombre: frente.nombre },
  });

  if (!foundFrente) {
    return new NextResponse(
      JSON.stringify({ error: "Frente not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    let blobUrl: string | null;
    const areaLower = area.toLowerCase();

    const areaFieldMap: Record<string, keyof typeof foundFrente> = {
      acarreos: "excelUrlAcarreosBlob",
      gasolina: "excelUrlGasolinaBlob",
      concreto: "excelUrlConcretoBlob",
      asfalto: "excelUrlAsfaltoBlob",
      vouchercamion: "excelUrlVoucherCamionBlob",
    };
    blobUrl = (foundFrente[areaFieldMap[areaLower]] as string | null) ?? null;


    try {
      if (blobUrl) {
        await blobClient.deleteBlob(blobUrl);
      } else {
        console.error("Blob URL is null or undefined.");
      }
    } catch (error: any) {
      console.error(`Failed to delete blob ${blobUrl}:`, error);
    }

    return NextResponse.json(
      { message: "All blobs deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to delete blobs:", error);
    return NextResponse.json(
      {
        message: `Failed to delete blobs: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
