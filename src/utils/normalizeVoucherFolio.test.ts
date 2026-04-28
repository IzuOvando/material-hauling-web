import {
  normalizeVoucherFolio,
  parseVoucherFolios,
} from "./normalizeVoucherFolio";

describe("normalizeVoucherFolio", () => {
  describe("new format (12-char Crockford base32)", () => {
    test("accepts raw 12-char input unchanged", () => {
      expect(normalizeVoucherFolio("D2F7K7M3P9F2")).toEqual({
        raw: "D2F7K7M3P9F2",
        valid: true,
      });
    });

    test("strips hyphens from display format", () => {
      expect(normalizeVoucherFolio("D2F7-K7M3-P9F2")).toEqual({
        raw: "D2F7K7M3P9F2",
        valid: true,
      });
    });

    test("uppercases lowercase input", () => {
      expect(normalizeVoucherFolio("d2f7k7m3p9f2")).toEqual({
        raw: "D2F7K7M3P9F2",
        valid: true,
      });
    });

    test("uppercases and strips hyphens from lowercase display format", () => {
      expect(normalizeVoucherFolio("d2f7-k7m3-p9f2")).toEqual({
        raw: "D2F7K7M3P9F2",
        valid: true,
      });
    });

    test("trims surrounding whitespace", () => {
      expect(normalizeVoucherFolio("  D2F7-K7M3-P9F2  ")).toEqual({
        raw: "D2F7K7M3P9F2",
        valid: true,
      });
    });
  });

  describe("legacy UUID format (36 chars)", () => {
    test("accepts valid UUID and lowercases it", () => {
      expect(
        normalizeVoucherFolio("A3F2C1D0-84B2-4E9A-B5F1-0C3D2E1F4A78")
      ).toEqual({
        raw: "a3f2c1d0-84b2-4e9a-b5f1-0c3d2e1f4a78",
        valid: true,
      });
    });

    test("accepts already-lowercase UUID unchanged", () => {
      const uuid = "a3f2c1d0-84b2-4e9a-b5f1-0c3d2e1f4a78";
      expect(normalizeVoucherFolio(uuid)).toEqual({ raw: uuid, valid: true });
    });
  });

  describe("invalid inputs", () => {
    test("returns invalid for empty string", () => {
      expect(normalizeVoucherFolio("")).toEqual({ raw: "", valid: false });
    });

    test("returns invalid for 11-char string (one short)", () => {
      expect(normalizeVoucherFolio("D2F7K7M3P9F")).toEqual({
        raw: "D2F7K7M3P9F",
        valid: false,
      });
    });

    test("returns invalid for 13-char string (one over)", () => {
      expect(normalizeVoucherFolio("D2F7K7M3P9F2X")).toEqual({
        raw: "D2F7K7M3P9F2X",
        valid: false,
      });
    });

    test("returns invalid for malformed UUID (wrong structure)", () => {
      expect(normalizeVoucherFolio("ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ")).toEqual({
        raw: "ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ",
        valid: false,
      });
    });

    test("returns invalid for random short string", () => {
      expect(normalizeVoucherFolio("ABC123")).toEqual({
        raw: "ABC123",
        valid: false,
      });
    });
  });
});

describe("parseVoucherFolios", () => {
  test("parses newline-separated folios", () => {
    const input = "D2F7-K7M3-P9F2\nA1B2C3D4E5F6";
    const result = parseVoucherFolios(input);
    expect(result.valid).toEqual(["D2F7K7M3P9F2", "A1B2C3D4E5F6"]);
    expect(result.invalid).toEqual([]);
    expect(result.duplicatesRemoved).toBe(0);
  });

  test("parses comma-separated folios", () => {
    const input = "D2F7-K7M3-P9F2, A1B2C3D4E5F6";
    const result = parseVoucherFolios(input);
    expect(result.valid).toEqual(["D2F7K7M3P9F2", "A1B2C3D4E5F6"]);
  });

  test("parses mixed newline and comma separators", () => {
    const input = "D2F7-K7M3-P9F2\nA1B2C3D4E5F6, B9C8D7E6F5A4";
    const result = parseVoucherFolios(input);
    expect(result.valid).toHaveLength(3);
  });

  test("deduplicates identical folios (raw and display format)", () => {
    const input = "D2F7-K7M3-P9F2\nD2F7K7M3P9F2";
    const result = parseVoucherFolios(input);
    expect(result.valid).toEqual(["D2F7K7M3P9F2"]);
    expect(result.duplicatesRemoved).toBe(1);
  });

  test("separates invalid format entries", () => {
    const input = "D2F7-K7M3-P9F2\nNOT-VALID\nA1B2C3D4E5F6";
    const result = parseVoucherFolios(input);
    expect(result.valid).toEqual(["D2F7K7M3P9F2", "A1B2C3D4E5F6"]);
    expect(result.invalid).toEqual(["NOT-VALID"]);
  });

  test("skips blank lines", () => {
    const input = "D2F7-K7M3-P9F2\n\n\nA1B2C3D4E5F6";
    const result = parseVoucherFolios(input);
    expect(result.valid).toHaveLength(2);
  });

  test("returns empty arrays for blank input", () => {
    expect(parseVoucherFolios("")).toEqual({
      valid: [],
      invalid: [],
      duplicatesRemoved: 0,
    });
    expect(parseVoucherFolios("   \n\n  ")).toEqual({
      valid: [],
      invalid: [],
      duplicatesRemoved: 0,
    });
  });

  test("handles mixed UUIDs and new-format folios", () => {
    const uuid = "a3f2c1d0-84b2-4e9a-b5f1-0c3d2e1f4a78";
    const input = `D2F7-K7M3-P9F2\n${uuid}`;
    const result = parseVoucherFolios(input);
    expect(result.valid).toEqual(["D2F7K7M3P9F2", uuid]);
  });
});
