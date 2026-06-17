import { getTrucksFilters, getTrucksOrderBy } from "./filters";

describe("getTrucksFilters", () => {
  it("returns null for empty input", () => {
    expect(getTrucksFilters("")).toBeNull();
    expect(getTrucksFilters(null)).toBeNull();
    expect(getTrucksFilters(undefined)).toBeNull();
  });

  it("voucherDatetimeRange → gte/lte covering the range in local TZ", () => {
    const result = getTrucksFilters("voucherDatetimeRange=2026-04-01..2026-04-30");
    expect(result).not.toBeNull();
    const range = result!.voucherDatetime as { gte: Date; lte: Date };
    expect(range.gte).toBeInstanceOf(Date);
    expect(range.lte).toBeInstanceOf(Date);
    expect(range.gte.toISOString()).toBe("2026-04-01T06:00:00.000Z");
    expect(range.lte.toISOString()).toBe("2026-05-01T05:59:59.999Z");
  });

  it("q → OR over folio and noEconomico with ILIKE", () => {
    const result = getTrucksFilters("q=12345");
    expect(result).not.toBeNull();
    expect(result!.OR).toEqual([
      { folio: { contains: "12345", mode: "insensitive" } },
      { noEconomico: { contains: "12345", mode: "insensitive" } },
    ]);
  });

  it("status with single valid value → in", () => {
    const result = getTrucksFilters("status=IN_TRANSIT");
    expect(result!.status).toEqual({ in: ["IN_TRANSIT"] });
  });

  it("status with both values → in array", () => {
    const result = getTrucksFilters("status=IN_TRANSIT^ARRIVED");
    expect(result!.status).toEqual({ in: ["IN_TRANSIT", "ARRIVED"] });
  });

  it("status with invalid value → ignored", () => {
    const result = getTrucksFilters("status=UNKNOWN");
    expect(result).toBeNull();
  });

  it("turno coerces to numbers", () => {
    const result = getTrucksFilters("turno=1^2");
    expect(result!.turno).toEqual({ in: [1, 2] });
  });

  it("material multi-select via ^", () => {
    const result = getTrucksFilters("material=Terraplen^Tepetate");
    expect(result!.material).toEqual({ in: ["Terraplen", "Tepetate"] });
  });

  it("checkerName multi-select", () => {
    const result = getTrucksFilters("checkerName=Juan Garcia^Pedro Lopez");
    expect(result!.checkerName).toEqual({ in: ["Juan Garcia", "Pedro Lopez"] });
  });

  it("arrivalCheckerName multi-select", () => {
    const result = getTrucksFilters("arrivalCheckerName=Mario");
    expect(result!.arrivalCheckerName).toEqual({ in: ["Mario"] });
  });

  it("combines multiple fields", () => {
    const result = getTrucksFilters(
      "voucherDatetimeRange=2026-04-01..2026-04-30|status=ARRIVED|material=Terraplen"
    );
    expect(result!.voucherDatetime).toBeDefined();
    expect(result!.status).toEqual({ in: ["ARRIVED"] });
    expect(result!.material).toEqual({ in: ["Terraplen"] });
  });

  it("ignores unknown fields", () => {
    const result = getTrucksFilters("bogus=foo|status=ARRIVED");
    expect(result!.status).toEqual({ in: ["ARRIVED"] });
    expect((result as any).bogus).toBeUndefined();
  });
});

describe("getTrucksOrderBy", () => {
  it("voucherDate desc → voucherDatetime asc (sign '-' means asc)", () => {
    expect(getTrucksOrderBy("-voucherDate")).toEqual({ voucherDatetime: "asc" });
  });

  it("voucherTime asc → voucherDatetime desc (sign '+' means desc)", () => {
    expect(getTrucksOrderBy("+voucherTime")).toEqual({ voucherDatetime: "desc" });
  });

  it("folio → folio direct", () => {
    expect(getTrucksOrderBy("+folio")).toEqual({ folio: "desc" });
  });

  it("invalid sort string → undefined", () => {
    expect(getTrucksOrderBy("nonsense")).toBeUndefined();
    expect(getTrucksOrderBy("+unknownField")).toBeUndefined();
  });

  it("empty sort → undefined", () => {
    expect(getTrucksOrderBy(undefined)).toBeUndefined();
    expect(getTrucksOrderBy(null)).toBeUndefined();
    expect(getTrucksOrderBy("")).toBeUndefined();
  });
});
