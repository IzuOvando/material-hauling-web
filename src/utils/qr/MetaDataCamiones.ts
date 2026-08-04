import { InvalidDataError, ValidationError } from "@/errors";
import generateQRString from "./generateQRString";
import DataCompressor from "./dataCompressor";

class MetaDataCamiones {
  private placas: string | null = null;
  private noEconomico: string | null = null;
  private operador: string | null = null;
  private turno: number | null = null;
  private localidad: string | null = null;
  private frenteNombre: string | null = null;
  private cubicacion: number | null = null;
  private idCamion: string | null = null;
  private empresa: string | null = null;
  private noEmpleado: string | null = null;

  constructor() { }

  public setPlacas(placas: string): MetaDataCamiones {
    if (!placas || placas.trim() === "") {
      throw new ValidationError(
        "placas",
        "Las placas son requeridas y no pueden estar vacías."
      );
    }
    this.placas = placas;
    return this;
  }

  public setVolumen(volumen: number | string): MetaDataCamiones {
    const parsed = typeof volumen === "string" ? parseFloat(volumen) : volumen;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new ValidationError(
        "volumen",
        "El volumen es requerido y debe ser un número decimal mayor a 0."
      );
    }
    this.cubicacion = parsed;
    return this;
  }

  public setNoeconomico(noeconomico: string): MetaDataCamiones {
    if (!noeconomico || noeconomico.trim() === "") {
      throw new ValidationError(
        "noeconomico",
        "El No. Economico es requerido y no puede estar vacío."
      );
    }
    this.noEconomico = noeconomico;
    return this;
  }

  public setOperador(operador: string): MetaDataCamiones {
    if (!operador || operador.trim() === "") {
      throw new ValidationError(
        "operador",
        "El operador es requerido y no puede estar vacío."
      );
    }
    this.operador = operador;
    return this;
  }

  public setTurno(turno: number | string): MetaDataCamiones {
    const validTurnos = [1, 2];
    const turnoNumber = typeof turno === "string" ? parseInt(turno, 10) : turno;
    if (!validTurnos.includes(turnoNumber)) {
      throw new ValidationError("turno", "El turno debe ser 1 o 2.");
    }
    this.turno = turnoNumber;
    return this;
  }

  public setLocalidad(localidad: string): MetaDataCamiones {
    if (!localidad || localidad.trim() === "") {
      throw new ValidationError(
        "localidad",
        "La localidad es requerida y no puede estar vacía."
      );
    }
    this.localidad = localidad;
    return this;
  }

  public setFrente(frente: string): MetaDataCamiones {
    const frenteRegex = /^[A-Z0-9]+-F([0-9]+T?[0-9]*|G)$/;
    if (!frente || !frenteRegex.test(frente)) {
      throw new ValidationError(
        "frente",
        "frenteNombre must match format {SIGLAS}-F{identifier} (e.g. TPCDMXP-F1, TPCDMXP-F1T2, TPQI-FG)"
      );
    }
    this.frenteNombre = frente;
    return this;
  }

  public setEmpresa(empresa: string): MetaDataCamiones {
    if (!empresa || empresa.trim() === "") {
      throw new ValidationError(
        "empresa",
        "La empresa es requerida y no puede estar vacía."
      );
    }
    this.empresa = empresa;
    return this;
  }

  public setNoempleado(noempleado: string): MetaDataCamiones {
    if (!noempleado || noempleado.trim() === "") {
      throw new ValidationError(
        "noempleado",
        "El No. Empleado es requerido y no puede estar vacío."
      );
    }
    this.noEmpleado = noempleado;
    return this;
  }

  private setIdcamion(): void {
    if (this.frenteNombre && this.noEconomico) {
      this.idCamion = `SDN-${this.frenteNombre}-${this.noEconomico}`;
    } else {
      throw new InvalidDataError(
        "Frente y No Economico deben estar establecidos para generar el ID del camión."
      );
    }
  }

  public build() {
    this.setIdcamion();
    return this;
  }

  public getIdCamion() {
    return this.idCamion;
  }

  public toQR() {
    if (!this.isComplete()) {
      throw new Error("Faltan campos requeridos para generar el QR.");
    }

    const qrText = [
      `Placas: ${this.placas}`,
      `No Economico: ${this.noEconomico}`,
      `Operador: ${this.operador}`,
      `Turno: ${this.turno}`,
      `Localidad: ${this.localidad}`,
      `Frente: ${this.frenteNombre}`,
      `Cubicacion: ${this.cubicacion}`,
      `Empresa: ${this.empresa}`,
      `No Empleado: ${this.noEmpleado}`,
      `Id Camion: ${this.idCamion}`
    ].join('\n');
    const compressed = DataCompressor.compressString(qrText);
    const value = `${compressed}${DataCompressor.DATA_CAMION_SUFFIX}`;
    return generateQRString(value);
  }

  private isComplete(): boolean {
    return (
      this.placas !== null &&
      this.placas !== "" &&
      this.noEconomico !== null &&
      this.noEconomico !== "" &&
      this.idCamion !== null &&
      this.idCamion !== "" &&
      this.operador !== null &&
      this.operador !== "" &&
      this.turno !== null &&
      this.localidad !== null &&
      this.localidad !== "" &&
      this.frenteNombre !== null &&
      this.frenteNombre !== "" &&
      this.empresa !== null &&
      this.empresa !== "" &&
      this.noEmpleado !== null &&
      this.noEmpleado !== "" &&
      this.cubicacion !== null
    );
  }
}

export default MetaDataCamiones;
