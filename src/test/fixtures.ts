import { Ticket } from "@prisma/client";

export const tickets: Ticket[] = [
  {
    uuid: crypto.randomUUID(),
    fecha: "2021-10-10",
    cubicacion: "600",
    checador: "1004",
    empresa: "Sunight, S.A. de C.V.",
    idCamion: "Truck A",
    material: "Roca",
    operador: "Juan",
    placas: "ABC-123",
    banco: "Santander",
    hora: "10:00",
    noEmpleado: "1004",
    proyecto: "Proyecto 1",
    createdAt: new Date(),
  },
];
