import { VoucherDateTimeUtil } from "./voucherdatetime";

// All timestamps below are UTC. Mexico City is UTC-6 (permanently, no DST since 2023).
// Local midnight Mexico City = 06:00 UTC, so voucherDate is always stored at T06:00:00Z.

describe("VoucherDateTimeUtil", () => {
  describe("splitDateTime", () => {
    it("should split a daytime ISO string into local date and UTC time parts", () => {
      // 14:30 UTC = 08:30 AM Mexico City → local date is March 7
      const input = "2026-03-07T14:30:45.123Z";
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(input);

      expect(voucherDate.toISOString()).toBe("2026-03-07T06:00:00.000Z");
      expect(voucherTime.toISOString()).toBe("1970-01-01T14:30:45.123Z");
    });

    it("should handle a Date object input", () => {
      const input = new Date("2026-03-07T14:30:45.123Z");
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(input);

      expect(voucherDate.toISOString()).toBe("2026-03-07T06:00:00.000Z");
      expect(voucherTime.toISOString()).toBe("1970-01-01T14:30:45.123Z");
    });

    it("should assign the local date correctly when UTC midnight crosses to the previous local day", () => {
      // 00:00 UTC = 18:00 Mexico City on the PREVIOUS day (March 6)
      const input = "2026-03-07T00:00:00.000Z";
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(input);

      expect(voucherDate.toISOString()).toBe("2026-03-06T06:00:00.000Z");
      expect(voucherTime.toISOString()).toBe("1970-01-01T00:00:00.000Z");
    });

    it("should assign the local date correctly for end-of-day UTC (5 PM local)", () => {
      // 23:59 UTC = 17:59 Mexico City → still March 7
      const input = "2026-03-07T23:59:59.999Z";
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(input);

      expect(voucherDate.toISOString()).toBe("2026-03-07T06:00:00.000Z");
      expect(voucherTime.toISOString()).toBe("1970-01-01T23:59:59.999Z");
    });

    it("should assign the local date correctly for a late-night voucher (11 PM local)", () => {
      // 05:00 UTC = 23:00 Mexico City → local date is still April 2
      const input = "2026-04-03T05:00:00.000Z";
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(input);

      expect(voucherDate.toISOString()).toBe("2026-04-02T06:00:00.000Z");
      expect(voucherTime.toISOString()).toBe("1970-01-01T05:00:00.000Z");
    });

    it("should throw VoucherDateTimeError for invalid input", () => {
      expect(() => VoucherDateTimeUtil.splitDateTime("invalid")).toThrow(
        "Formato de fecha/hora inválido",
      );
    });
  });

  describe("combineDateTime", () => {
    it("should combine local date and UTC time into a single UTC Date", () => {
      // voucherDate: March 7 local midnight in UTC
      // voucherTime: 14:30 UTC = 08:30 AM local
      const voucherDate = new Date("2026-03-07T06:00:00.000Z");
      const voucherTime = new Date("1970-01-01T14:30:45.123Z");

      const result = VoucherDateTimeUtil.combineDateTime(voucherDate, voucherTime);

      expect(result.toISOString()).toBe("2026-03-07T14:30:45.123Z");
    });

    it("should combine local date with local midnight time correctly", () => {
      // voucherTime: 06:00 UTC = 00:00 Mexico City (local midnight)
      const voucherDate = new Date("2026-03-07T06:00:00.000Z");
      const voucherTime = new Date("1970-01-01T06:00:00.000Z");

      const result = VoucherDateTimeUtil.combineDateTime(voucherDate, voucherTime);

      expect(result.toISOString()).toBe("2026-03-07T06:00:00.000Z");
    });
  });

  describe("round-trip", () => {
    it("should preserve the original datetime through split and combine (morning)", () => {
      const original = "2026-03-07T14:30:45.123Z"; // 8:30 AM local
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(original);
      const result = VoucherDateTimeUtil.combineDateTime(voucherDate, voucherTime);

      expect(result.toISOString()).toBe(original);
    });

    it("should preserve the original datetime through split and combine (afternoon)", () => {
      const original = "2026-03-07T23:00:00.000Z"; // 5:00 PM local
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(original);
      const result = VoucherDateTimeUtil.combineDateTime(voucherDate, voucherTime);

      expect(result.toISOString()).toBe(original);
    });

    it("should preserve the original datetime through split and combine (late night)", () => {
      const original = "2026-04-03T05:00:00.000Z"; // 11:00 PM local on April 2
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(original);
      const result = VoucherDateTimeUtil.combineDateTime(voucherDate, voucherTime);

      expect(result.toISOString()).toBe(original);
    });

    it("should preserve datetime when UTC midnight crosses to the previous local day", () => {
      const original = "2026-03-07T00:00:00.000Z"; // 6:00 PM local on March 6
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(original);
      const result = VoucherDateTimeUtil.combineDateTime(voucherDate, voucherTime);

      expect(result.toISOString()).toBe(original);
    });
  });
});
