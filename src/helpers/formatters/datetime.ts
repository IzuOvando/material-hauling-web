import { DateTime } from "luxon";

export const formatIsoDate = (date: Date) => {
  return DateTime.fromJSDate(date, { zone: "utc" }).toLocal().toISODate();
};

export const formatIsoDateFromString = (date: string) => {
  return DateTime.fromISO(date, { zone: "utc" }).toLocal().toISODate();
};

export const formatLongSpanishDate = (date: Date) => {
  return DateTime.fromJSDate(date, { zone: "utc" })
    .toLocal()
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
    .toLocal()
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

  const dt = DateTime.fromJSDate(time, { zone: "utc" }).toLocal();

  if (!dt.isValid) return "\u2014";

  const format = "h:mm a";
  const formattedTime = dt.toFormat(format);

  return lowercase
    ? formattedTime.replace("AM", "a.m.").replace("PM", "p.m.")
    : formattedTime.replace("am", "AM").replace("pm", "PM");
};

export const formatTime12HourFromString = (
  time: string,
  lowercase?: boolean,
) => {
  const dt = DateTime.fromISO(time, { zone: "utc" }).toLocal();

  if (!dt.isValid) return "\u2014";

  const format = "h:mm a";
  const formattedTime = dt.toFormat(format);

  return lowercase
    ? formattedTime.replace("AM", "a.m.").replace("PM", "p.m.")
    : formattedTime.replace("am", "AM").replace("pm", "PM");
};

export const formatDateAndTimeToString = (date: Date) => {
  const luxonDate = DateTime.fromJSDate(date, { zone: "utc" }).toLocal();

  const formattedDate = luxonDate.toLocaleString(DateTime.DATETIME_SHORT, {
    locale: "es",
  });

  return formattedDate;
};
