import { Settings } from "luxon";
import {
  formatIsoDate,
  formatIsoDateFromString,
  formatLongSpanishDate,
  formatLongSpanishDateFromString,
  formatTime12Hour,
  formatTime12HourFromString,
  formatDateAndTimeToString,
} from "./datetime";

// Fix Luxon's local zone to America/Mexico_City for deterministic tests
beforeAll(() => {
  Settings.defaultZone = "America/Mexico_City";
});

afterAll(() => {
  Settings.defaultZone = "system";
});

describe("Datetime helpers functions", () => {
  // 27 August 2024, 14:30 UTC = 08:30 AM Mexico City (UTC-6 DST)
  const sampleDate = new Date(Date.UTC(2024, 7, 27, 14, 30, 0));

  describe("formatIsoDate", () => {
    test("should format a Date to ISO date in local timezone", () => {
      expect(formatIsoDate(sampleDate)).toBe("2024-08-27");
    });

    test("should shift date when UTC time crosses day boundary in local timezone", () => {
      // 2024-08-28T05:00:00Z = 2024-08-27T23:00:00 in Mexico City (UTC-6 DST)
      const nearMidnight = new Date(Date.UTC(2024, 7, 28, 5, 0, 0));
      expect(formatIsoDate(nearMidnight)).toBe("2024-08-27");
    });
  });

  describe("formatIsoDateFromString", () => {
    test("should format an ISO string to ISO date in local timezone", () => {
      expect(formatIsoDateFromString("2024-08-27T14:30:00.000Z")).toBe("2024-08-27");
    });

    test("should shift date when UTC time crosses day boundary in local timezone", () => {
      expect(formatIsoDateFromString("2024-08-28T05:00:00.000Z")).toBe("2024-08-27");
    });
  });

  describe("formatLongSpanishDate", () => {
    test("should return a long formatted Spanish date in local timezone", () => {
      expect(formatLongSpanishDate(sampleDate)).toBe(
        "martes, 27 de agosto de 2024"
      );
    });
  });

  describe("formatLongSpanishDateFromString", () => {
    test("should return a long formatted Spanish date from a string in local timezone", () => {
      expect(formatLongSpanishDateFromString("2024-08-27T14:30:00.000Z")).toBe(
        "martes, 27 de agosto de 2024"
      );
    });
  });

  describe("formatTime12Hour", () => {
    test("should convert UTC time to local 12-hour format (AM/PM)", () => {
      // 14:30 UTC = 8:30 AM Mexico City (UTC-6 CDT in August)
      expect(formatTime12Hour(sampleDate)).toBe("8:30 AM");
    });

    test("should support lowercase format", () => {
      expect(formatTime12Hour(sampleDate, true)).toBe("8:30 a.m.");
    });

    test("should return dash for null", () => {
      expect(formatTime12Hour(null)).toBe("\u2014");
    });

    test("should return dash for undefined", () => {
      expect(formatTime12Hour(undefined)).toBe("\u2014");
    });
  });

  describe("formatTime12HourFromString", () => {
    test("should convert UTC time string to local 12-hour format (AM/PM)", () => {
      // 14:30 UTC = 8:30 AM Mexico City (UTC-6 CDT in August)
      expect(formatTime12HourFromString("2024-08-27T14:30:00Z")).toBe("8:30 AM");
    });

    test("should support lowercase format", () => {
      expect(formatTime12HourFromString("2024-08-27T14:30:00Z", true)).toBe(
        "8:30 a.m."
      );
    });

    test("should return dash for invalid input", () => {
      expect(formatTime12HourFromString("invalid")).toBe("\u2014");
    });
  });

  describe("formatDateAndTimeToString", () => {
    test("should format UTC date as localized date and time in local timezone", () => {
      const result = formatDateAndTimeToString(sampleDate);
      // In Mexico City (UTC-6 CDT): 8:30 on August 27
      expect(result).toMatch(/27/);
      expect(result).toMatch(/8:30/);
    });
  });
});
