import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { Section } from "@/types";
import DatabaseDownloader from "@/actions/databasedownloader";

const isValidAreaOrSection = (type: string) => {
  const upperCaseType = type.toUpperCase();
  return Object.values(Section).includes(upperCaseType as Section);
};

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (user.role === "user") {
    return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
  }

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

  const typeLower = type.toLowerCase();

  if (typeLower === "vouchercamion") {
    try {
      const fileName = `bbd_${frente}.xlsx`;
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

  const foundFrente = await prisma.frente.findUnique({
    where: { nombre: frente },
  });

  if (!foundFrente) {
    return new NextResponse(JSON.stringify({ error: "Frente not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const blobUrl = foundFrente.excelUrlVoucherCamionBlob;

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
