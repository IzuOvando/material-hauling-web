export type SchemaKeys = 'gasolina' | 'acarreos';

export const schemas: Record<SchemaKeys, Set<string>> = {
    gasolina: new Set([
        "folio",
        "autorizacion",
        "litros",
        "fecha",
        "formato pago",
        "placas",
        "hora",
        "total",
        "bomba",
        "saldocompra",
        "formatopago",
        "preciounitario"
    ]),
    acarreos: new Set([
        "folio",
        "placas",
        "cubicacion",
        "fecha",
        "material",
        "banco",
        "hora",
        "operador",
        "checador",
        "empresa",
        "proyecto",
        "idcamion",
    ]),
};
