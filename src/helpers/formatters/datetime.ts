import { DateTime } from "luxon";

export const formatIsoDate = (date: Date) => {
  return date
    .toLocaleDateString("en-GB", {
      timeZone: "UTC",
    })
    .replace(/\//g, "-");
};

export const formatIsoDateFromString = (date: string) => {
  return new Date(date)
    .toLocaleDateString("en-GB", {
      timeZone: "UTC",
    })
    .replace(/\//g, "-");
};

export const formatLongSpanishDate = (date: Date) => {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const formatLongSpanishDateFromString = (date: string) => {
  return new Date(date).toLocaleDateString("es-MX", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const formatTime12Hour = (time: Date, lowercase?: boolean) => {
  const dt = DateTime.fromJSDate(time, { zone: "utc" });

  const format = "h:mm a";

  const formattedTime = dt.toFormat(format);

  if (lowercase) {
    return formattedTime.replace("AM", "a.m.").replace("PM", "p.m.");
  } else {
    return formattedTime.replace("am", "AM").replace("pm", "PM");
  }
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
    timeZone: "UTC",
  });
};

export const formatDateAndTimeToString = (date: Date) => {
  const luxonDate = DateTime.fromJSDate(date);

  const formattedDate = luxonDate.toLocaleString(DateTime.DATETIME_SHORT, {
    locale: "es",
  });

  return formattedDate;
};
