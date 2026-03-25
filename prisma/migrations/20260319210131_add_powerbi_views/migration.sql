CREATE VIEW voucher_camion_powerbi AS
SELECT
  uuid,
  "voucherDate",
  "voucherTime",
  material,
  status::text,
  "odometerArrival",
  odometer,
  "arrivalTime",
  "noEconomico",
  cubicacion,
  "frenteNombre",
  "idCamion",
  latitude,
  longitude,
  "locationAccuracy",
  "locationTimestamp",
  "arrivalLatitude",
  "arrivalLongitude",
  "arrivalLocationAccuracy",
  "arrivalLocationTimestamp"
FROM "VoucherCamion";

CREATE VIEW frente_powerbi AS
SELECT nombre
FROM "Frente";