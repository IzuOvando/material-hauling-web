import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/auth/auth.user";
import blobClient from "@/lib/blobClient";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (user.role !== "owner") {
    return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
  }

    try {
        if (req.method !== 'POST') {
            return NextResponse.json(
                { error: "Method Not Allowed" },
                { status: 405 }
            );
        }

        const { blobUrls } = await req.json();

        if (!Array.isArray(blobUrls) || blobUrls.some(url => typeof url !== 'string')) {
            return NextResponse.json(
                { error: "Invalid input: blobUrls should be an array of strings" },
                { status: 400 }
            );
        }

        const deletePromises = blobUrls.map(url => blobClient.deleteBlob(url));

        await Promise.all(deletePromises);

        logSecurityEvent({
            type: SecurityEventType.DATA_DELETE,
            ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
            resource: "/api/files/delete-blobs",
            details: { count: blobUrls.length },
        });

        return NextResponse.json({
            message: "Blobs deleted successfully.",
        });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json(
                { error: `Error processing the request: ${error.message}` },
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
