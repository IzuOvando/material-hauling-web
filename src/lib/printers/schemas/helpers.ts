import {
  formatIsoDateFromString,
  formatTime12HourFromString,
} from "@/helpers/formatters/datetime";
import { formatVolume } from "@/helpers/formatters/numbers";

export const setPrintableMetanames = (
  metanames: string[],
  maxLenght: number
) => {
  return metanames.map((metaname) => ({
    normal: metaname,
    printable: `${metaname}:\t`.toUpperCase().padStart(maxLenght, " "),
    formatter: getFormatter(metaname),
  }));
};

const getFormatter = (metaname: string) => {
  switch (metaname) {
    case "fecha":
      return formatIsoDateFromString;
    case "hora":
      return formatTime12HourFromString;
    case "cubicacion":
      return (value: any) => formatVolume(value as number, true, false);
    default:
      return (value: any) => value;
  }
};
