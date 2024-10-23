/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "./route";
import prisma from "@/lib/db";
import { invalidVouchersFixture, vouchersFixture } from '@/app/api/fixtures/vouchersFixture'


jest.mock("@/lib/db", () => ({
    ...jest.requireActual("@/lib/db"),
    voucherCamion: {
        create: jest.fn().mockImplementation((data) => Promise.resolve({ ...data })),
    },
    $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
}));

describe("POST api/mobile/vouchers", () => {
    it("should create vouchers successfully", async () => {
        const response = await fetch('http://localhost:3000/api/mobile/vouchers', {
            method: 'POST',
            body: JSON.stringify(vouchersFixture),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(response.status).toBe(201);
        const responseBody = await response.json();
        expect(responseBody.message).toBe("Vouchers created successfully");
    });

    it("should return 400 if no data is provided", async () => {
        const request = new NextRequest("http://localhost:3000/api/mobile/vouchers", {
            method: "POST",
            body: JSON.stringify([]),
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.error).toBe("No data provided");
    });

    it("should return 400 for invalid JSON format", async () => {
        const request = new NextRequest("http://localhost:3000/api/mobile/vouchers", {
            method: "POST",
            body: "{ invalid: json }",
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.error).toBe("Invalid JSON format");
    });

    it("should return 400 on server error", async () => {
        jest.spyOn(prisma.voucherCamion, "create").mockRejectedValueOnce(new Error("Database error"));

        const request = new NextRequest("http://localhost:3000/api/mobile/vouchers", {
            method: "POST",
            body: JSON.stringify(invalidVouchersFixture),
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
    });
});
