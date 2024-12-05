import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import prisma from "@/lib/db";
import { Section, TicketArea } from "@/types";
import DatabaseDownloader from "@/actions/databasedownloader";

const isValidAreaOrSection = (type: string) => {
  const upperCaseType = type.toUpperCase();

  if (Object.values(TicketArea).includes(upperCaseType as TicketArea)) {
    return true;
  }

  if (Object.values(Section).includes(upperCaseType as Section)) {
    return true;
  }

  return false;
};

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
  
  const { frente, area, section } = data;
  const type = area || section;

  if (!type || !isValidAreaOrSection(type)) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid area or section" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const foundFrente = await prisma.frente.findUnique({
    where: { nombre: frente },
  });

  if (!foundFrente) {
    return new NextResponse(JSON.stringify({ error: "Frente not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let blobUrl: string | null;
  const typeLower = type.toLowerCase();

  if (typeLower === "vouchercamion") {
    try {
      const fileName = `bbd_${frente}.xlsx`
      const outputExcel = `db_output/excel/${frente}`;
      const downloader = new DatabaseDownloader();
      await downloader.downloadDatabase(outputExcel, typeLower, fileName);
    } catch (error) {
      console.error("Error creating Excel for voucherCamion:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to create Excel for voucherCamion" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  if (typeLower === "acarreos") {
    blobUrl = foundFrente.excelUrlAcarreosBlob;
  } else if (typeLower === "gasolina") {
    blobUrl = foundFrente.excelUrlGasolinaBlob;
  } else if (typeLower === "vouchercamion") {
    blobUrl = foundFrente.excelUrlGasolinaBlob;
  } else {
    blobUrl = foundFrente.excelUrlConcretoBlob;
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
      "Content-Disposition": `attachment; filename="${type}.xlsx"`,
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
