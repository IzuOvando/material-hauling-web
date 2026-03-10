import { DateTime } from "luxon";
import CONFIG from "@/config";

export const formatDateToDDMMYYYY = (date: Date) => {
  return DateTime.fromJSDate(date, { zone: "utc" })
    .setZone(CONFIG.TIMEZONE)
    .toFormat("dd/MM/yyyy");
};

export const formatDateTimeToDDMMYYYY_HHMM = (date: Date): string =>
  `${formatDateToDDMMYYYY(date)} ${formatTime12Hour(date, true)}`;

export const formatIsoDate = (date: Date) => {
  return DateTime.fromJSDate(date, { zone: "utc" })
    .setZone(CONFIG.TIMEZONE)
    .toISODate();
};

export const formatIsoDateFromString = (date: string) => {
  return DateTime.fromISO(date, { zone: "utc" })
    .setZone(CONFIG.TIMEZONE)
    .toISODate();
};

export const formatLongSpanishDate = (date: Date) => {
  return DateTime.fromJSDate(date, { zone: "utc" })
    .setZone(CONFIG.TIMEZONE)
    .setLocale("es-MX")
    .toLocaleString({
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
};

export const formatLongSpanishDateFromString = (date: string) => {
  return DateTime.fromISO(date, { zone: "utc" })
    .setZone(CONFIG.TIMEZONE)
    .setLocale("es-MX")
    .toLocaleString({
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
};

export const formatTime12Hour = (time?: Date | null, lowercase?: boolean) => {
  if (!time) return "\u2014";

  const dt = DateTime.fromJSDate(time, { zone: "utc" }).setZone(CONFIG.TIMEZONE);

  if (!dt.isValid) return "\u2014";

  const formattedTime = dt.toFormat("h:mm a");

  return lowercase
    ? formattedTime.replace("AM", "a.m.").replace("PM", "p.m.")
    : formattedTime.replace("am", "AM").replace("pm", "PM");
};

export const formatTime12HourFromString = (
  time: string,
  lowercase?: boolean,
) => {
  const dt = DateTime.fromISO(time, { zone: "utc" }).setZone(CONFIG.TIMEZONE);

  if (!dt.isValid) return "\u2014";

  const formattedTime = dt.toFormat("h:mm a");

  return lowercase
    ? formattedTime.replace("AM", "a.m.").replace("PM", "p.m.")
    : formattedTime.replace("am", "AM").replace("pm", "PM");
};

export const formatDateAndTimeToString = (date: Date) => {
  return DateTime.fromJSDate(date, { zone: "utc" })
    .setZone(CONFIG.TIMEZONE)
    .setLocale("es")
    .toLocaleString(DateTime.DATETIME_SHORT);
};