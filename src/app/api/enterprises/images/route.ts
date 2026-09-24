import { promises as fs } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import whiteLabelConfig from "#/white-label.config";

export async function GET(req: NextRequest) {
  try {
    const publicFolderPath = path.join(process.cwd(), whiteLabelConfig.assets.enterpriseImagesFolder);

    const fileNames = await fs.readdir(publicFolderPath);

    return NextResponse.json({
      directory: whiteLabelConfig.assets.enterpriseImagesDirectory,
      images: fileNames,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read files" },
      { status: 500 }
    );
  }
}
