/**
 * @jest-environment node
 */

import { PUT } from "./route";
import { requireDashboardAccess } from "@/auth/guards";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

jest.mock("@/auth/guards");
jest.mock("@/auth/securityLogger", () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventType: { DATA_UPDATE: "DATA_UPDATE" },
}));
jest.mock("bcryptjs");
jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { user: { update: jest.fn() } },
}));
jest.mock("@prisma/client", () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, opts: { code: string }) {
      super(message);
      this.code = opts.code;
    }
  }
  return { Prisma: { PrismaClientKnownRequestError } };
});

const makeRequest = (body: object) =>
  new NextRequest("http://localhost/api/user/testuser/password", {
    method: "PUT",
    body: JSON.stringify(body),
  });

const ownerSession = { name: "owner", role: "owner", frentes: [] };

describe("PUT /api/user/[username]/password", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns 403 if caller is not owner", async () => {
    (requireDashboardAccess as jest.Mock).mockResolvedValue({ role: "admin" });

    const res = await PUT(makeRequest({ password: "hash123" }), {
      params: { username: "testuser" },
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.message).toBe("FORBIDDEN");
  });

  it("returns 400 if password is missing", async () => {
    (requireDashboardAccess as jest.Mock).mockResolvedValue(ownerSession);

    const res = await PUT(makeRequest({}), {
      params: { username: "testuser" },
    });

    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 400 if password is empty string", async () => {
    (requireDashboardAccess as jest.Mock).mockResolvedValue(ownerSession);

    const res = await PUT(makeRequest({ password: "" }), {
      params: { username: "testuser" },
    });

    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("hashes the password and updates the user on success", async () => {
    (requireDashboardAccess as jest.Mock).mockResolvedValue(ownerSession);
    (bcrypt.hash as jest.Mock).mockResolvedValue("bcrypt-hashed-pw");
    (prisma.user.update as jest.Mock).mockResolvedValue({ username: "testuser" });

    const res = await PUT(makeRequest({ password: "sha256clienthash" }), {
      params: { username: "testuser" },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(bcrypt.hash).toHaveBeenCalledWith("sha256clienthash", 12);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { username: "testuser" },
      data: { password: "bcrypt-hashed-pw" },
    });
  });

  it("returns 404 if user does not exist (P2025)", async () => {
    (requireDashboardAccess as jest.Mock).mockResolvedValue(ownerSession);
    (bcrypt.hash as jest.Mock).mockResolvedValue("bcrypt-hashed-pw");

    const { Prisma } = await import("@prisma/client");
    (prisma.user.update as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("User not found", { code: "P2025" })
    );

    const res = await PUT(makeRequest({ password: "sha256clienthash" }), {
      params: { username: "ghost" },
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.message).toBe("User not found");
  });

  it("returns 500 on unexpected error", async () => {
    (requireDashboardAccess as jest.Mock).mockResolvedValue(ownerSession);
    (bcrypt.hash as jest.Mock).mockResolvedValue("bcrypt-hashed-pw");
    (prisma.user.update as jest.Mock).mockRejectedValue(new Error("DB crashed"));

    const res = await PUT(makeRequest({ password: "sha256clienthash" }), {
      params: { username: "testuser" },
    });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.message).toBe("Internal Server Error");
  });
});
