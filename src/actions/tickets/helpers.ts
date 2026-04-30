import { TicketArea, Section } from "@/types";
import { DateTime } from "luxon";
import CONFIG from "@/config";

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
  [TicketArea.CONCRETO]: [
    "uuid",
    "fecha",
    "horaSalida",
    "elemento",
    "fc",
    "cubicacion",
    "rev",
    "tempConcreto",
    "tempAmbiente",
    "marca",
    "cliente",
    "empresa",
    "planta",
    "destino",
    "noEconomico",
    "operador",
    "placas",
  ],
  [TicketArea.ASFALTO]: [
    "uuid",
    "fecha",
    "horaSalida",
    "material",
    "cubicacion",
    "rev",
    "tempAsfalto",
    "marca",
    "empresa",
    "planta",
    "destino",
    "noEconomico",
    "operador",
    "placas",
  ],
  [Section.VOUCHERCAMION]: [
    "folio",
    "idCamion",
    "placas",
    "odometer",
    "odometerArrival",
    "status",
    "arrivalTime",
    "material",
    "cubicacion",
    "origen",
    "destino",
    "voucherDate",   // UI column id → maps to voucherDatetime in DB
    "voucherTime",   // UI column id → maps to voucherDatetime in DB
    "operador",
    "noEmpleado",
    "turno",
    "localidad",
    "empresa",
    "checkerName",
    "checkerNo",
  ],
};

export const FILTER_FIELDS = {
  [TicketArea.ACARREOS]: ["fecha", "idCamion", "material", "empresa"],
  [TicketArea.GASOLINA]: ["fecha", "placas", "bomba"],
  [TicketArea.CONCRETO]: [
    "fecha",
    "elemento",
    "empresa",
    "noEconomico",
    "destino",
  ],
  [TicketArea.ASFALTO]: [
    "fecha",
    "empresa",
    "material",
    "noEconomico",
    "destino",
  ],
  [Section.VOUCHERCAMION]: [
    "idCamion",
    "odometer",
    "material",
    "origen",
    "destino",
    "voucherDatetime",
  ],
};

export function getOrderBy(sort: string, area: TicketArea | Section): any {
  const regex = /^([+-])(\w+)$/;
  const sortMatch = sort.match(regex);

  if (!sortMatch) return undefined;

  const sign = sortMatch[1];
  const field = sortMatch[2];

  if (!SORT_FIELDS[area].includes(field)) return undefined;

  // UI columns voucherDate and voucherTime both sort by the single DB column
  const prismaField =
    field === "voucherDate" || field === "voucherTime" ? "voucherDatetime" : field;

  return {
    [prismaField]: sign === "-" ? "asc" : "desc",
  };
}

export function getFilters(filters: string, area: TicketArea | Section): any {
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

      if (!FILTER_FIELDS[area].includes(field) || values.length === 0) return;

      // Date-range query: filter values are local date strings (YYYY-MM-DD)
      if (field === "voucherDatetime") {
        const ranges = (values as string[]).map((localDate) => ({
          gte: DateTime.fromISO(localDate, { zone: CONFIG.TIMEZONE })
            .startOf("day")
            .toUTC()
            .toJSDate(),
          lte: DateTime.fromISO(localDate, { zone: CONFIG.TIMEZONE })
            .endOf("day")
            .toUTC()
            .toJSDate(),
        }));
        if (ranges.length === 1) {
          filtersOnWhere[field] = ranges[0];
        } else {
          // Prisma doesn't support field-level OR; place it at the where root
          filtersOnWhere["OR"] = ranges.map((r) => ({ voucherDatetime: r }));
        }
        return;
      }

      if (field === "bomba" || field === "odometer")
        values = values.map((value) => Number(value));
      filtersOnWhere[field] = { in: values };
    }
  });

  return Object.keys(filtersOnWhere).length > 0 ? filtersOnWhere : null;
}
