import {
  getMonthRange,
  isFullMonthRange,
  formatMonthYear,
} from "./periods";

describe("getMonthRange", () => {
  it("spans the 1st → last day of a 30-day month", () => {
    expect(getMonthRange(2026, 6)).toEqual({
      from: "2026-06-01",
      to: "2026-06-30",
    });
  });

  it("spans the 1st → last day of a 31-day month", () => {
    expect(getMonthRange(2026, 1)).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("handles February in a leap year", () => {
    expect(getMonthRange(2024, 2)).toEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    });
  });

  it("handles February in a non-leap year", () => {
    expect(getMonthRange(2026, 2)).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });
});

describe("isFullMonthRange", () => {
  it("true for a full calendar month", () => {
    expect(isFullMonthRange({ from: "2026-06-01", to: "2026-06-30" })).toBe(true);
  });

  it("false for a partial month", () => {
    expect(isFullMonthRange({ from: "2026-06-01", to: "2026-06-15" })).toBe(false);
    expect(isFullMonthRange({ from: "2026-06-02", to: "2026-06-30" })).toBe(false);
  });

  it("false for a range spanning two months", () => {
    expect(isFullMonthRange({ from: "2026-06-01", to: "2026-07-31" })).toBe(false);
  });

  it("false for null / invalid input", () => {
    expect(isFullMonthRange(null)).toBe(false);
    expect(isFullMonthRange({ from: "nope", to: "nope" })).toBe(false);
  });
});

describe("formatMonthYear", () => {
  it("renders the full Spanish month name and year", () => {
    expect(formatMonthYear({ from: "2026-06-01", to: "2026-06-30" })).toBe(
      "junio 2026"
    );
    expect(formatMonthYear({ from: "2026-01-01", to: "2026-01-31" })).toBe(
      "enero 2026"
    );
  });
});
