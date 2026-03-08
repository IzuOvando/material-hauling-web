import { VoucherDateTimeUtil } from "./voucherdatetime";

describe("VoucherDateTimeUtil", () => {
  describe("splitDateTime", () => {
    it("should split an ISO string into UTC date and time parts", () => {
      const input = "2026-03-07T14:30:45.123Z";
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(input);

      expect(voucherDate.toISOString()).toBe("2026-03-07T00:00:00.000Z");
      expect(voucherTime.toISOString()).toBe("1970-01-01T14:30:45.123Z");
    });

    it("should handle a Date object input", () => {
      const input = new Date("2026-03-07T14:30:45.123Z");
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(input);

      expect(voucherDate.toISOString()).toBe("2026-03-07T00:00:00.000Z");
      expect(voucherTime.toISOString()).toBe("1970-01-01T14:30:45.123Z");
    });

    it("should handle midnight UTC correctly", () => {
      const input = "2026-03-07T00:00:00.000Z";
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(input);

      expect(voucherDate.toISOString()).toBe("2026-03-07T00:00:00.000Z");
      expect(voucherTime.toISOString()).toBe("1970-01-01T00:00:00.000Z");
    });

    it("should handle end-of-day UTC correctly", () => {
      const input = "2026-03-07T23:59:59.999Z";
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(input);

      expect(voucherDate.toISOString()).toBe("2026-03-07T00:00:00.000Z");
      expect(voucherTime.toISOString()).toBe("1970-01-01T23:59:59.999Z");
    });

    it("should throw VoucherDateTimeError for invalid input", () => {
      expect(() => VoucherDateTimeUtil.splitDateTime("invalid")).toThrow(
        "Formato de fecha/hora inválido"
      );
    });
  });

  describe("combineDateTime", () => {
    it("should combine UTC date and time parts into a single Date", () => {
      const voucherDate = new Date("2026-03-07T00:00:00.000Z");
      const voucherTime = new Date("1970-01-01T14:30:45.123Z");

      const result = VoucherDateTimeUtil.combineDateTime(voucherDate, voucherTime);

      expect(result.toISOString()).toBe("2026-03-07T14:30:45.123Z");
    });

    it("should combine midnight time correctly", () => {
      const voucherDate = new Date("2026-03-07T00:00:00.000Z");
      const voucherTime = new Date("1970-01-01T00:00:00.000Z");

      const result = VoucherDateTimeUtil.combineDateTime(voucherDate, voucherTime);

      expect(result.toISOString()).toBe("2026-03-07T00:00:00.000Z");
    });
  });

  describe("round-trip", () => {
    it("should preserve the original datetime through split and combine", () => {
      const original = "2026-03-07T14:30:45.123Z";
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(original);
      const result = VoucherDateTimeUtil.combineDateTime(voucherDate, voucherTime);

      expect(result.toISOString()).toBe(original);
    });

    it("should preserve datetime near day boundary (11 PM UTC)", () => {
      const original = "2026-03-07T23:00:00.000Z";
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(original);
      const result = VoucherDateTimeUtil.combineDateTime(voucherDate, voucherTime);

      expect(result.toISOString()).toBe(original);
    });

    it("should preserve datetime at start of day (12 AM UTC)", () => {
      const original = "2026-03-07T00:00:00.000Z";
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(original);
      const result = VoucherDateTimeUtil.combineDateTime(voucherDate, voucherTime);

      expect(result.toISOString()).toBe(original);
    });
  });
});
