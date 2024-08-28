import { formatPrice, formatVolume } from "./numbers";

describe("numbers utility functions", () => {
  test("formatPrice should format a number to a currency", () => {
    expect(formatPrice(1234.56)).toBe("$1,234.56");
    expect(formatPrice(0)).toBe("$0.00");
    expect(formatPrice(1000000)).toBe("$1,000,000.00");
  });

  test("formatVolume should format volume in liters without fixed decimals", () => {
    expect(formatVolume(500)).toBe("500 L");
  });

  test("formatVolume should format volume in liters with fixed decimals", () => {
    expect(formatVolume(500, false, true)).toBe("500.00 L");
  });

  test("formatVolume should format volume in cubic meters without fixed decimals", () => {
    expect(formatVolume(5, true)).toBe("5 m³");
  });

  test("formatVolume should format volume in cubic meters with fixed decimals", () => {
    expect(formatVolume(5, true, true)).toBe("5.00 m³");
  });

  test("formatVolume should format volume in liters", () => {
    expect(formatVolume(1234.567, false, false)).toBe("1234.567 L");
  });

  test("formatVolume should format volume in cube meters", () => {
    expect(formatVolume(1234.567, true, false)).toBe("1234.567 m³");
  });
});
