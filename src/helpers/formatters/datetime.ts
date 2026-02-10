import { DateTime } from "luxon";

export const formatIsoDate = (date: Date) => {
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
};

export const formatIsoDateFromString = (date: string) => {
  return new Date(date).toLocaleDateString("en-GB").replace(/\//g, "-");
};

export const formatLongSpanishDate = (date: Date) => {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const formatLongSpanishDateFromString = (date: string) => {
  return new Date(date).toLocaleDateString("es-MX", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTime12Hour = (
  time?: Date | null,
  lowercase?: boolean
) => {
  if (!time) return "—";

  const dt = DateTime.fromJSDate(time);

  if (!dt.isValid) return "—";

  const format = "h:mm a";
  const formattedTime = dt.toFormat(format);

  return lowercase
    ? formattedTime.replace("AM", "a.m.").replace("PM", "p.m.")
    : formattedTime.replace("am", "AM").replace("pm", "PM");
};

export const formatTime12HourFromString = (
  time: string,
  lowercase?: boolean
) => {
  const lang = lowercase ? "es-MX" : "en-US";
  return new Date(time).toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatDateAndTimeToString = (date: Date) => {
  const luxonDate = DateTime.fromJSDate(date);

  const formattedDate = luxonDate.toLocaleString(DateTime.DATETIME_SHORT, {
    locale: "es",
  });

  return formattedDate;
};
