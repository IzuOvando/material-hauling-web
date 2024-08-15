import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

type ClientPayload = {
  frenteId: string;
  area: string;
};

type CustomPayload = {
  pathname: string;
  callbackUrl: string;
  clientPayload: string;
  multipart: boolean;
};
type CustomHandleUploadBody = HandleUploadBody & {
  payload: CustomPayload;
};

export async function POST(request: Request): Promise<NextResponse> {

  const body = (await request.json()) as CustomHandleUploadBody;

  let blobUrl: string | null = null;
  if (request.method !== "POST") {
    return NextResponse.json(
      { error: "Method Not Allowed" },
      { status: 405 }
    );
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {

        try {
          const clientPayload = body.payload.clientPayload;
          const payload: ClientPayload = JSON.parse(clientPayload);

          return {
            allowedContentTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            tokenPayload: JSON.stringify({
              frente: payload.frenteId,
              area: payload.area,
            }),
          };
        } catch (error) {
          console.error("Error parsing clientPayload:", error);
          throw new Error("Failed to parse clientPayload.");
        }
      },
      onUploadCompleted: async () => {
      },
    });

    return NextResponse.json(jsonResponse);
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