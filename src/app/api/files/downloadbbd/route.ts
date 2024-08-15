import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const data = await req.json();
  const { frente, area }: { frente: string; area: string } = data;

  if (!frente) {
    return new NextResponse(
      JSON.stringify({ error: "Frente nombre is missing" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const foundFrente = await prisma.frente.findUnique({
    where: { nombre: frente },
  });

  if (!foundFrente) {
    return new NextResponse(
      JSON.stringify({ error: "Frente not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  let blobUrl: string | null;
  const areaLower = area.toLowerCase();

  if (areaLower === "acarreos") {
    blobUrl = foundFrente.excelUrlAcarreosBlob;
  } else {
    blobUrl = foundFrente.excelUrlGasolinaBlob;
  }

  if (!blobUrl) {
    return new NextResponse(
      JSON.stringify({ error: "Blob URL is not defined" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const response = await axios.get(blobUrl, {
      responseType: "arraybuffer",
    });

    const headers = new Headers({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${area}.xlsx"`,
    });

    return new Response(response.data, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return new Response(JSON.stringify({ error: "Failed to download file" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
