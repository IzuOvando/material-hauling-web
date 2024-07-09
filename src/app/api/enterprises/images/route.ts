import { promises as fs } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const publicFolderPath = path.join(
      process.cwd(),
      "public",
      "images",
      "enterprises"
    );

    const fileNames = await fs.readdir(publicFolderPath);

    return NextResponse.json({
      directory: "/images/enterprises",
      images: fileNames,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read files" },
      { status: 500 }
    );
  }
}
