import { getFilters, getOrderBy } from "./helpers";
import { Section, TicketArea } from "@/types";

describe("getFilters – voucherDatetime range query", () => {
  it("single date → gte/lte range covering that local day", () => {
    const result = getFilters("voucherDatetime=2026-04-01", Section.VOUCHERCAMION);

    expect(result).not.toBeNull();
    expect(result.voucherDatetime).toBeDefined();
    expect(result.voucherDatetime.gte).toBeInstanceOf(Date);
    expect(result.voucherDatetime.lte).toBeInstanceOf(Date);

    // Mexico City = UTC-6 (no DST since 2022)
    // 2026-04-01 00:00 MX = 2026-04-01T06:00:00Z
    expect(result.voucherDatetime.gte.toISOString()).toBe("2026-04-01T06:00:00.000Z");
    // 2026-04-01 23:59:59.999 MX = 2026-04-02T05:59:59.999Z
    expect(result.voucherDatetime.lte.toISOString()).toBe("2026-04-02T05:59:59.999Z");
  });

  it("two dates → OR array with two ranges at top level", () => {
    const result = getFilters(
      "voucherDatetime=2026-04-01^2026-04-02",
      Section.VOUCHERCAMION
    );

    expect(result).not.toBeNull();
    expect(result.OR).toHaveLength(2);

    const [r1, r2] = result.OR as Array<{ voucherDatetime: { gte: Date; lte: Date } }>;
    expect(r1.voucherDatetime.gte.toISOString()).toBe("2026-04-01T06:00:00.000Z");
    expect(r1.voucherDatetime.lte.toISOString()).toBe("2026-04-02T05:59:59.999Z");
    expect(r2.voucherDatetime.gte.toISOString()).toBe("2026-04-02T06:00:00.000Z");
    expect(r2.voucherDatetime.lte.toISOString()).toBe("2026-04-03T05:59:59.999Z");
  });

  it("date + material → both conditions present", () => {
    const result = getFilters(
      "voucherDatetime=2026-04-01|material=arena",
      Section.VOUCHERCAMION
    );

    expect(result).not.toBeNull();
    expect(result.voucherDatetime).toBeDefined();
    expect(result.material).toEqual({ in: ["arena"] });
  });

  it("empty value → no voucherDatetime filter", () => {
    const result = getFilters("voucherDatetime=", Section.VOUCHERCAMION);
    expect(result).toBeNull();
  });

  it("unknown field → null", () => {
    const result = getFilters("unknownField=foo", Section.VOUCHERCAMION);
    expect(result).toBeNull();
  });
});

describe("getOrderBy – voucherDate/voucherTime map to voucherDatetime", () => {
  it("sorts by voucherDate desc → voucherDatetime asc (sign '-' = asc)", () => {
    const result = getOrderBy("-voucherDate", Section.VOUCHERCAMION);
    expect(result).toEqual({ voucherDatetime: "asc" });
  });

  it("sorts by voucherDate asc → voucherDatetime desc (sign '+' = desc)", () => {
    const result = getOrderBy("+voucherDate", Section.VOUCHERCAMION);
    expect(result).toEqual({ voucherDatetime: "desc" });
  });

  it("sorts by voucherTime desc → voucherDatetime asc", () => {
    const result = getOrderBy("-voucherTime", Section.VOUCHERCAMION);
    expect(result).toEqual({ voucherDatetime: "asc" });
  });

  it("other fields not mapped", () => {
    const result = getOrderBy("+folio", Section.VOUCHERCAMION);
    expect(result).toEqual({ folio: "desc" });
  });

  it("invalid field → undefined", () => {
    const result = getOrderBy("+nonexistent", Section.VOUCHERCAMION);
    expect(result).toBeUndefined();
  });

  it("acarreos fecha → not remapped", () => {
    const result = getOrderBy("+fecha", TicketArea.ACARREOS);
    expect(result).toEqual({ fecha: "desc" });
  });
});
