import { NextRequest } from "next/server";
import FileProcessor from "@/actions/convert";
import { invalidateFacetsCache } from "@/actions/tickets";
import { isAllowedUrl } from "@/utils/urlValidator";

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
    const data = await req.json();
    const { fileName, area, excelBlobUrl, frente } = data;
    // Validate URL to prevent SSRF attacks
    if (!isAllowedUrl(excelBlobUrl)) {
      return new Response(
        JSON.stringify({ error: "Invalid or unauthorized URL" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const fileProcessor = new FileProcessor();
    await fileProcessor.processFiles(fileName, area, excelBlobUrl);
    await invalidateFacetsCache(frente, area);

    return new Response(
      JSON.stringify({ message: "Files processed successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
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
      },
    );
  }
}
