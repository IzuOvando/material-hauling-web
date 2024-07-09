import { NextRequest, NextResponse } from "next/server";
import FileProcessor from "@/actions/convert";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const { fileName } = await req.json();

    const fileProcessor = new FileProcessor();
    await fileProcessor.processFiles(fileName);

    return new Response(
      JSON.stringify({ message: "Files processed successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: `Failed to process files: ${errorMessage}` }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
