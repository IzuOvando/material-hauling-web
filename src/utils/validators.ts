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
  const frenteRegex = /^[A-Z0-9]+-F([0-9]+T?[0-9]*|G)$/;
  if (!frente || !frenteRegex.test(frente)) {
    throw new ValidationError(
      "frente",
      "frenteNombre must match format {SIGLAS}-F{identifier} (e.g. TPCDMXP-F1, TPCDMXP-F1T2, TPQI-FG)"
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
    throw new ValidationError(
      "frente",
      "El frente no existe en la base de datos.",
    );
  }
};

// TODO: Implement this validator when mayority of users have recent changes when uploading tickets
export const validateMaterialForFrente = async (
  material: string,
  frenteNombre: string,
  prisma: any,
) => {
  const assignment = await prisma.materialFrente.findFirst({
    where: {
      frenteNombre,
      material: { nombre: material, isActive: true },
    },
  });
  if (!assignment) {
    throw new ValidationError(
      "material",
      `El material "${material}" no es válido para el frente ${frenteNombre}.`,
    );
  }
};
