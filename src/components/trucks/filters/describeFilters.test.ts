import whiteLabelConfig from "#/white-label.config";
import { describeTrucksFilters } from "./describeFilters";

const { trucksFilters, filters: filterLabels } = whiteLabelConfig.ui;

describe("describeTrucksFilters", () => {
  it("describes every filter the server applies, in the terms of the filter chips", () => {
    const lines = describeTrucksFilters(
      "voucherDatetimeRange=2026-10-27..2026-10-28|status=ARRIVED|turno=2|material=Tepetate^Grava|q=T1",
    );

    expect(lines).toHaveLength(5);
    expect(lines[0]).toMatch(new RegExp(`^${trucksFilters.periodLabelPrefix}: `));
    expect(lines.slice(1)).toEqual([
      `${trucksFilters.statusLabelPrefix}: ${trucksFilters.statusArrived}`,
      `${filterLabels.shift}: 2°`,
      `${filterLabels.material}: Tepetate, Grava`,
      `${trucksFilters.searchLabelPrefix}: "T1"`,
    ]);
  });

  it("names the checkers with their own labels", () => {
    expect(describeTrucksFilters("checkerName=Ana|arrivalCheckerName=Luis^Marta")).toEqual([
      `${filterLabels.departureChecker}: Ana`,
      `${filterLabels.arrivalChecker}: Luis, Marta`,
    ]);
  });

  it("returns nothing when there are no filters", () => {
    expect(describeTrucksFilters("")).toEqual([]);
  });

  it("skips what the server ignores: ALL, unknown values, bad dates and unknown fields", () => {
    expect(
      describeTrucksFilters("voucherDatetimeRange=bad..range|status=ALL|turno=ALL|nope=1|status=|solo"),
    ).toEqual([]);
  });
});
