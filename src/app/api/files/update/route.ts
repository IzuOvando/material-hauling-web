import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import prisma from "@/lib/db";

const unlink = promisify(fs.unlink);

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const data = await req.json();
  const { nombre, area } = data;

  const rootPath = path.resolve(process.cwd());
  const desiredPart = nombre.split('_')[1].split('.')[0];
  const specificFilePath = path.join(rootPath, "db_output", "excel", desiredPart, `${area}.xslx`);
  try {

    await unlink(specificFilePath);

    return NextResponse.json(
      { message: "All files and data deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    if ((error?.message as string).includes("no such file or directory"))
      return NextResponse.json(
        { message: "All files and data deleted successfully." },
        { status: 200 }
      );
    console.error("Failed to delete files or data:", error);
    return NextResponse.json(
      {
        message: `Failed to delete files or data: ${error instanceof Error ? error.message : "Unknown error"
          }`,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
