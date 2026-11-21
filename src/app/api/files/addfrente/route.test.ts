/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { POST } from "./route";
import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import whiteLabelConfig from "#/white-label.config";

jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { frente: { create: jest.fn() } },
}));
jest.mock("@/auth/auth.user", () => ({ getAppUser: jest.fn() }));

const db = prisma as unknown as { frente: { create: jest.Mock } };

const addFrente = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/files/addfrente", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  (getAppUser as jest.Mock).mockResolvedValue({ name: "owner01", role: "owner" });
  db.frente.create.mockImplementation(({ data }) => Promise.resolve(data));
});

describe("POST /api/files/addfrente", () => {
  it("requires a logged in user", async () => {
    (getAppUser as jest.Mock).mockResolvedValue(null);

    expect((await addFrente({ nombre: "PROJ-A1" })).status).toBe(401);
    expect(db.frente.create).not.toHaveBeenCalled();
  });

  it("only lets owners create a frente", async () => {
    (getAppUser as jest.Mock).mockResolvedValue({ name: "admin01", role: "admin" });

    expect((await addFrente({ nombre: "PROJ-A1" })).status).toBe(403);
    expect(db.frente.create).not.toHaveBeenCalled();
  });

  it.each(["PROJ-F1", "PROJ-A1", "PROJ-01"])("creates %s", async nombre => {
    const res = await addFrente({ nombre });

    expect(res.status).toBe(200);
    expect(db.frente.create).toHaveBeenCalledWith({ data: { nombre } });
  });

  it("trims and uppercases the name before saving it", async () => {
    await addFrente({ nombre: "  proj-a1 " });

    expect(db.frente.create).toHaveBeenCalledWith({ data: { nombre: "PROJ-A1" } });
  });

  it("keeps the project type and the tiro catalog flag", async () => {
    await addFrente({ nombre: "PROJ-A1", tipoProyecto: "LINEAL", enableTiroCatalog: true });

    expect(db.frente.create).toHaveBeenCalledWith({
      data: { nombre: "PROJ-A1", tipoProyecto: "LINEAL", enableTiroCatalog: true },
    });
  });

  it.each(["", "PROJ", "PROJ-", "PROJ A1", "AB-CD-F1", "PROJ_A1"])(
    "rejects the invalid name %p with the message of the form",
    async nombre => {
      const res = await addFrente({ nombre });

      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe(whiteLabelConfig.ui.frentesManager.addDialog.invalidFormat);
      expect(db.frente.create).not.toHaveBeenCalled();
    },
  );

  it("rejects a body without a text name", async () => {
    expect((await addFrente({})).status).toBe(400);
    expect((await addFrente({ nombre: 123 })).status).toBe(400);
    expect(db.frente.create).not.toHaveBeenCalled();
  });

  it("rejects an unknown project type", async () => {
    expect((await addFrente({ nombre: "PROJ-A1", tipoProyecto: "OTRO" })).status).toBe(400);
    expect(db.frente.create).not.toHaveBeenCalled();
  });

  it("answers 409 when the frente already exists", async () => {
    db.frente.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "test" }),
    );

    const res = await addFrente({ nombre: "PROJ-A1" });

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Ese frente ya existe.");
  });
});
