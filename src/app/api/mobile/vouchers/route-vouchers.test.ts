/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "./route";
import prisma from "@/lib/db";
import { invalidVouchersFixture, vouchersFixture } from '@/app/api/fixtures/vouchersFixture'

jest.mock("@/auth/TokenAuthenticator", () => ({
    TokenAuthenticator: {
        verify: jest.fn().mockReturnValue(true),
        decode: jest.fn().mockReturnValue({ username: "testuser", role: "owner" }),
    },
}));

jest.mock("@/lib/db", () => ({
    ...jest.requireActual("@/lib/db"),
    voucherCamion: {
        create: jest.fn().mockImplementation((data) => Promise.resolve({ ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockImplementation((data) => Promise.resolve({ ...data })),
    },
    material: {
        findFirst: jest.fn().mockResolvedValue(null),
    },
    $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
    $executeRaw: jest.fn().mockResolvedValue(1),
}));

jest.mock("@/actions/dashboard", () => ({
    invalidateDashboardCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/actions/trucks", () => ({
    invalidateTrucksFacetsCache: jest.fn().mockResolvedValue(undefined),
}));

describe("POST api/mobile/vouchers", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should create vouchers successfully", async () => {
        const request = new NextRequest("http://localhost:3000/api/mobile/vouchers", {
            method: "POST",
            body: JSON.stringify(vouchersFixture),
            headers: {
                "Content-Type": "application/json",
                "authorization": "Bearer valid_token",
            },
        });

        const response = await POST(request);
        expect(response.status).toBe(201);
        const responseBody = await response.json();
        expect(responseBody.message).toBe("Vouchers procesados con éxito");
    });

    it("should return 400 if no data is provided", async () => {
        const request = new NextRequest("http://localhost:3000/api/mobile/vouchers", {
            method: "POST",
            body: JSON.stringify([]),
            headers: { "authorization": "Bearer valid_token" },
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.error).toBe("No se proporcionaron datos de vouchers");
    });

    it("should return 400 for invalid JSON format", async () => {
        const request = new NextRequest("http://localhost:3000/api/mobile/vouchers", {
            method: "POST",
            body: "{ invalid: json }",
            headers: { "authorization": "Bearer valid_token" },
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.error).toBe("Formato JSON inválido");
    });

    it("should return 400 on server error", async () => {
        jest.spyOn(prisma.voucherCamion, "create").mockRejectedValueOnce(new Error("Database error"));

        const request = new NextRequest("http://localhost:3000/api/mobile/vouchers", {
            method: "POST",
            body: JSON.stringify(invalidVouchersFixture),
            headers: { "authorization": "Bearer valid_token" },
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
    });
});
