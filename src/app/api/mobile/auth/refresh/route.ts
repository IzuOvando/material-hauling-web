import { NextRequest, NextResponse } from "next/server";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    try {
        const { refreshToken } = await req.json();

        if (!refreshToken) {
            return NextResponse.json({ message: "Se requiere un refresh token" }, { status: 400 });
        }

        const tokens = TokenAuthenticator.refresh(refreshToken);

        logSecurityEvent({ type: SecurityEventType.TOKEN_REFRESH, ip, resource: "/api/mobile/auth/refresh" });

        return NextResponse.json({ tokens }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            logSecurityEvent({ type: SecurityEventType.TOKEN_REFRESH_FAILURE, ip, resource: "/api/mobile/auth/refresh", details: { reason: error.message } });

            switch (error.message) {
                case "Invalid refreshToken: expired":
                    return NextResponse.json({ message: "El refresh token ha expirado" }, { status: 401 });
                case "Invalid refreshToken: malformed":
                    return NextResponse.json({ message: "El refresh token es inválido o está mal formado" }, { status: 401 });
                case "Invalid refreshToken claims":
                    return NextResponse.json({ message: "Los claims del refresh token son inválidos" }, { status: 401 });
                default:
                    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
            }
        }

        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
    }
}
