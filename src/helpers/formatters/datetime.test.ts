import {
  formatIsoDate,
  formatIsoDateFromString,
  formatLongSpanishDate,
  formatLongSpanishDateFromString,
  formatTime12Hour,
  formatTime12HourFromString,
} from "./datetime";

describe("Datetime helpers functions", () => {
  const sampleDate = new Date(Date.UTC(2024, 7, 27, 14, 30, 0)); // 27 August 2024, 14:30 UTC

  test('formatIsoDate should format a Date object to "DD-MM-YYYY"', () => {
    expect(formatIsoDate(sampleDate)).toBe("27-08-2024");
  });

  test('formatIsoDateFromString should format a date string to "DD-MM-YYYY"', () => {
    expect(formatIsoDateFromString("2024-08-27")).toBe("27-08-2024");
  });

  test("formatLongSpanishDate should return a long formatted Spanish date", () => {
    // Assuming Spanish translation for 27 August 2024 is "martes, 27 de agosto de 2024"
    expect(formatLongSpanishDate(sampleDate)).toBe(
      "martes, 27 de agosto de 2024"
    );
  });

  test("formatLongSpanishDateFromString should return a long formatted Spanish date from a string", () => {
    // Assuming Spanish translation for 27 August 2024 is "martes, 27 de agosto de 2024"
    expect(formatLongSpanishDateFromString("2024-08-27")).toBe(
      "martes, 27 de agosto de 2024"
    );
  });

  test("formatTime12Hour should format a Date object to 12-hour format (AM/PM) in en-US", () => {
    expect(formatTime12Hour(sampleDate)).toBe("02:30 PM");
  });

  test("formatTime12Hour should format a Date object to 12-hour format (am/pm) in es-MX", () => {
    expect(formatTime12Hour(sampleDate, true)).toBe("02:30 p.m.");
  });

  test("formatTime12HourFromString should format a time string to 12-hour format (AM/PM) in en-US", () => {
    expect(formatTime12HourFromString("2024-08-27T14:30:00Z")).toBe("02:30 PM");
  });

  test("formatTime12HourFromString should format a time string to 12-hour format (am/pm) in es-MX", () => {
    expect(formatTime12HourFromString("2024-08-27T14:30:00Z", true)).toBe(
      "02:30 p.m."
    );
  });
});
