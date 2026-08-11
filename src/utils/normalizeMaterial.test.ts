import { normalizeMaterial } from "./normalizeMaterial";

describe("normalizeMaterial", () => {
  test("strips accents from vowels", () => {
    expect(normalizeMaterial("Hidráulica")).toBe("hidraulica");
  });

  test("lowercases all characters", () => {
    expect(normalizeMaterial("TERRAPLEN")).toBe("terraplen");
  });

  test("trims surrounding whitespace", () => {
    expect(normalizeMaterial("  Tezontle  ")).toBe("tezontle");
  });

  test("handles mixed accents, casing, and whitespace", () => {
    expect(normalizeMaterial("  BasÉ HidráUlica  ")).toBe("base hidraulica");
  });

  test("produces same output for known production variants", () => {
    const variants = ["Base Hidráulica", "Basé Hidráulica", "BasÉ HidráUlica"];
    const normalized = variants.map(normalizeMaterial);
    expect(new Set(normalized).size).toBe(1);
    expect(normalized[0]).toBe("base hidraulica");
  });

  test("strips ñ tilde (ñ decomposes to n + combining tilde in NFD)", () => {
    expect(normalizeMaterial("Terrapleñ")).toBe("terraplen");
  });

  test("handles already-clean input unchanged", () => {
    expect(normalizeMaterial("terraplen")).toBe("terraplen");
  });

  test("handles empty string", () => {
    expect(normalizeMaterial("")).toBe("");
  });
});
