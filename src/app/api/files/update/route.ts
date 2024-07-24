import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/db";
import { deleteFilesInDirectory } from "@/helpers/deletefilesdirectory";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const data = await req.json();
  const { nombre, area } = data;

  const rootPath = path.resolve(process.cwd());
  const specificFilePath = path.join(rootPath, "db_output", "excel", nombre, `${area}.xslx`);
  const dbInputPathFilePath = path.join(rootPath, "db_input");
  const csvFilePath = path.join(rootPath, "db_output", "csv");

  try {
    const paths = [specificFilePath, dbInputPathFilePath, csvFilePath];

    for (const path of paths) {
      try {
        const stat = await fs.stat(path);
        if (stat.isDirectory()) {
          await deleteFilesInDirectory(path);
          await fs.rmdir(path);
        } else {
          await fs.unlink(path);
        }
      } catch (error: any) {
        if ((error?.message as string).includes("no such file or directory")) {
          console.warn(`The path ${path} does not exist.`);
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json(
      { message: "All files and data deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
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
