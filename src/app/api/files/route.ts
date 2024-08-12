import { NextRequest, NextResponse } from "next/server";
import blobClient from "@/lib/blobClient";
import { Buffer } from "buffer";

export async function POST(req: NextRequest) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No file uploaded or incorrect file type" },
        { status: 400 }
      );
    }

    const fileName = (file as File).name;

    const nameRoute = `db_input/${fileName}`

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    const response = await blobClient.putBlob(
      nameRoute,
      buffer,
      { access: 'public' }
    );

    return NextResponse.json({
      message: "File uploaded and processed successfully.",
      blobUrl: response.url,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Error processing the file: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}
