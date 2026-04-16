import { formatVoucherId } from "./formatVoucherId";

describe("formatVoucherId", () => {
  test("inserts hyphens every 4 chars for canonical 12-char IDs", () => {
    expect(formatVoucherId("D2F7K7M3P9F2")).toBe("D2F7-K7M3-P9F2");
    expect(formatVoucherId("00000000000A")).toBe("0000-0000-000A");
  });

  test("returns legacy UUID v4 strings unchanged", () => {
    const uuid = "a3f2c1d0-84b2-4e9a-b5f1-0c3d2e1f4a78";
    expect(formatVoucherId(uuid)).toBe(uuid);
  });

  test("returns other-length strings unchanged", () => {
    expect(formatVoucherId("")).toBe("");
    expect(formatVoucherId("short")).toBe("short");
    expect(formatVoucherId("D2F7K7M3P9F")).toBe("D2F7K7M3P9F"); // 11 chars
    expect(formatVoucherId("D2F7K7M3P9F2X")).toBe("D2F7K7M3P9F2X"); // 13 chars
  });
});
