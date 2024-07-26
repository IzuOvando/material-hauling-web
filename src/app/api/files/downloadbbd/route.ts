import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const readFile = promisify(fs.readFile);

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
  const { nombre, area }: { nombre: string; area: string } = data;

  const rootPath = path.resolve(process.cwd());
  const specificFilePath = path.join(
    rootPath,
    "db_output",
    "excel",
    nombre,
    `${area.toLowerCase()}.xlsx`
  );

  try {
    const fileBuffer = await readFile(specificFilePath);
    const headers = new Headers({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${area}.xlsx"`,
    });

    return new Response(fileBuffer, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return new Response(JSON.stringify({ error: "Failed to read file" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
