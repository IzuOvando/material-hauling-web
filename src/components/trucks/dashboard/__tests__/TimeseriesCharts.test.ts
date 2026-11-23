import { formatTick, formatTooltipLabel } from "../TimeseriesCharts";

describe("TimeseriesCharts labels", () => {
  it("year view: the axis shows the month, the tooltip the full day", () => {
    expect(formatTick("2026-10-28", "year")).toBe("oct 26");
    expect(formatTooltipLabel("2026-10-28", "year")).toMatch(/28.*oct.*2026/i);
  });

  it("year view: two days of the same month get different tooltip labels", () => {
    expect(formatTooltipLabel("2026-10-27", "year")).not.toBe(
      formatTooltipLabel("2026-10-28", "year")
    );
  });

  it("week and month views keep the day and month", () => {
    expect(formatTooltipLabel("2026-10-28", "week")).toMatch(/^28 oct/i);
    expect(formatTooltipLabel("2026-10-28", "month")).toMatch(/^28 oct/i);
  });
});
