export enum TicketArea {
  ACARREOS = "ACARREOS",
  GASOLINA = "GASOLINA",
  CONCRETO = "CONCRETO",
  ASFALTO = "ASFALTO",
}

export enum Section {
  VOUCHERCAMION = "VOUCHERCAMION",
}

export const TicketAreaList = [
  {
    label: "Acarreos",
    value: TicketArea.ACARREOS,
  },
  {
    label: "Gasolina",
    value: TicketArea.GASOLINA,
  },
  {
    label: "Concreto",
    value: TicketArea.CONCRETO,
  },
  {
    label: "Asfalto",
    value: TicketArea.ASFALTO,
  },
];

export enum VoucherCamionStatus {
  IN_TRANSIT = "IN_TRANSIT",
  ARRIVED = "ARRIVED",
}
