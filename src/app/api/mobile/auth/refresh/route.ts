import { NextRequest, NextResponse } from "next/server";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";

export async function POST(req: NextRequest) {
    try {
        const { refreshToken } = await req.json();

        if (!refreshToken) {
            return NextResponse.json({ message: "Refresh token is required" }, { status: 400 });
        }

        const tokens = TokenAuthenticator.refresh(refreshToken);

        return NextResponse.json({ tokens }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            switch (error.message) {
                case "Invalid refreshToken: expired":
                    return NextResponse.json({ message: "Refresh token has expired" }, { status: 401 });
                case "Invalid refreshToken: malformed":
                    return NextResponse.json({ message: "Invalid or malformed refresh token" }, { status: 401 });
                case "Invalid refreshToken claims":
                    return NextResponse.json({ message: "Invalid refresh token claims" }, { status: 401 });
                default:
                    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
            }
        }

        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
