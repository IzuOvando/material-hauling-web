import { TicketArea } from "@/types";

export const SORT_FIELDS = {
  [TicketArea.ACARREOS]: [
    "uuid",
    "folio",
    "fecha",
    "hora",
    "material",
    "cubicacion",
    "empresa",
    "banco",
    "placas",
    "idCamion",
    "operador",
    "noEmpleado",
    "checador",
    "proyecto",
  ],
  [TicketArea.GASOLINA]: [
    "folio",
    "fecha",
    "hora",
    "litros",
    "precioUnitario",
    "total",
    "placas",
    "bomba",
    "formatoPago",
    "autorizacion",
    "saldoCompra",
  ],
};

export const FILTER_FIELDS = {
  [TicketArea.ACARREOS]: ["fecha", "idCamion", "material", "empresa"],
  [TicketArea.GASOLINA]: ["fecha", "placas", "bomba"],
};

export function getOrderBy(sort: string, area: TicketArea): any {
  const regex = /^([+-])(\w+)$/;
  const sortMatch = sort.match(regex);

  if (!sortMatch) return undefined;

  const sign = sortMatch[1];
  const field = sortMatch[2];

  if (!SORT_FIELDS[area].includes(field)) return undefined;

  return {
    [field]: sign === "-" ? "asc" : "desc",
  };
}

export function getFilters(filters: string, area: TicketArea): any {
  const filtersOnWhere: any = {};
  const fieldsData = filters.split("|");

  fieldsData.forEach((fieldData) => {
    const splittedData = fieldData.split("=");
    if (splittedData.length === 2) {
      const field = splittedData[0].trim();
      let values: string[] | number[] = splittedData[1]
        .split("^")
        .map((value) => value.trim())
        .filter((value) => value !== "");
      if (FILTER_FIELDS[area].includes(field) && values.length !== 0)
        if (field === "bomba") values = values.map((value) => Number(value));
      filtersOnWhere[field] = { in: values };
    }
  });

  return Object.keys(filtersOnWhere).length > 0 ? filtersOnWhere : null;
}
