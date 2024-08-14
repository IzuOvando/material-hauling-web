import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

type CustomHandleUploadBody = HandleUploadBody & {
  frente: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {

  const body = (await request.json()) as CustomHandleUploadBody;

  let blobUrl: string | null = null;
  if (request.method !== "POST") {
    return NextResponse.json(
      { error: "Method Not Allowed" },
      { status: 405 }
    );
  }

  try {
    await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (clientPayload) => {

        const payload = JSON.parse(clientPayload);

        return {
          allowedContentTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
          tokenPayload: JSON.stringify({
            frente: payload.frenteId,
            area: payload.area
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        blobUrl = blob.url;
      },
    });

    if (blobUrl) {
      return NextResponse.json({
        message: "File uploaded and processed successfully.",
        blobUrl: blobUrl,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to retrieve blob URL after upload" },
        { status: 500 }
      );
    }
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
