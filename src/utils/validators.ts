export function isValidIPAddress(ip: string): boolean {
  const ipRegex =
    /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
  return ipRegex.test(ip);
}

export class ValidationError extends Error {
  field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

export const validateFrenteNombre = (frente: string) => {
  const frenteRegex = /^[a-zA-Z0-9]{4}$/;
  if (!frente || !frenteRegex.test(frente)) {
    throw new ValidationError(
      "frente",
      "El frente debe ser un valor de 4 caracteres alfanuméricos."
    );
  }
};

export const validateTurno = (turno: number | string) => {
  const validTurnos = [1, 2];
  const turnoNumber = typeof turno === "string" ? parseInt(turno, 10) : turno;
  if (!validTurnos.includes(turnoNumber)) {
    throw new ValidationError("turno", "El turno debe ser 1 o 2.");
  }
};

export const validateFrenteExists = async (frente: string, prisma: any) => {
  const frenteExists = await prisma.frente.findUnique({
    where: { nombre: frente },
  });
  if (!frenteExists) {
    throw new ValidationError("frente", "El frente no existe en la base de datos.");
  }
};
