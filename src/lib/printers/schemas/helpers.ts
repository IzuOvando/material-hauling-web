export const setPrintableMetanames = (
  metanames: string[],
  maxLenght: number
) => {
  return metanames.map((metaname) => ({
    normal: metaname,
    printable: `${metaname}:\t`.toUpperCase().padStart(maxLenght, " "),
  }));
};
