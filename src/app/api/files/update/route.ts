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
  const dbInputPath = path.join(rootPath, "db_input");
  const csvPath = path.join(rootPath, "db_output", "csv");

  try {
    const paths = [specificFilePath];

    // Delete specific file
    for (const filePath of paths) {
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isDirectory()) {
          await fs.unlink(filePath);
        }
      } catch (error: any) {
        if ((error?.message as string).includes("no such file or directory")) {
          console.warn(`The path ${filePath} does not exist.`);
        } else {
          throw error;
        }
      }
    }

    // Delete contents of directories but not the directories themselves
    const directories = [dbInputPath, csvPath];

    for (const dirPath of directories) {
      try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stat = await fs.stat(filePath);
          if (stat.isDirectory()) {
            await deleteFilesInDirectory(filePath);
            await fs.rmdir(filePath);
          } else {
            await fs.unlink(filePath);
          }
        }
      } catch (error: any) {
        if ((error?.message as string).includes("no such file or directory")) {
          console.warn(`The path ${dirPath} does not exist.`);
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
        message: `Failed to delete files or data: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
