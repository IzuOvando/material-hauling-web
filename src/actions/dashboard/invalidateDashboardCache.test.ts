/**
 * @jest-environment node
 */

import { kv } from "@vercel/kv";
import { invalidateDashboardCache } from "./index";

jest.mock("@vercel/kv", () => ({ kv: { scan: jest.fn(), del: jest.fn() } }));
jest.mock("@/lib/db", () => ({ __esModule: true, default: {} }));

const scan = kv.scan as unknown as jest.Mock;
const del = kv.del as unknown as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("invalidateDashboardCache", () => {
  it("walks every SCAN page, not just the first one", async () => {
    scan
      .mockResolvedValueOnce(["17", ["dashboard:F1:summary:week-1"]])
      .mockResolvedValueOnce(["42", []])
      .mockResolvedValueOnce(["0", ["dashboard:F1:timeseries:week-1", "dashboard:F1:breakdown:x"]]);

    await invalidateDashboardCache("F1");

    expect(scan.mock.calls.map(([cursor]) => cursor)).toEqual([0, 17, 42]);
    expect(scan).toHaveBeenCalledWith(0, { match: "dashboard:F1:*", count: 1000 });
    expect(del.mock.calls).toEqual([
      ["dashboard:F1:summary:week-1"],
      ["dashboard:F1:timeseries:week-1", "dashboard:F1:breakdown:x"],
    ]);
  });

  it("never throws, so a cache outage can't fail the request that changed data", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    scan.mockRejectedValue(new Error("redis down"));

    await expect(invalidateDashboardCache("F1")).resolves.toBeUndefined();
  });
});
