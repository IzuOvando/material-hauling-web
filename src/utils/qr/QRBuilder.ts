class QRBuilder {

    private placas: string | null = null;
    private idcamion: string | null = null;
    private operador: string | null = null;
    private turno: string | null = null;
    private frente: string | null = null;
    private noeconomico: string | null = null;
    private volumen: GLfloat | null = null;

    constructor() { }

    public setPlacas(placas: string): QRBuilder {
        if (!placas || placas.trim() === '') {
            throw new Error('Las placas son requeridas y no pueden estar vacías.');
        }
        this.placas = placas;
        return this;
    }

    public setIdCamion(idcamion: string): QRBuilder {
        if (!idcamion || idcamion.trim() === '') {
            throw new Error('El ID del camión es requerido y no puede estar vacío.');
        }
        this.idcamion = idcamion;
        return this;
    }

    public setOperador(operador: string): QRBuilder {
        if (!operador || operador.trim() === '') {
            throw new Error('El operador es requerido y no puede estar vacío.');
        }
        this.operador = operador;
        return this;
    }

    public setTurno(turno: string): QRBuilder {
        const validTurnos = [1, 2];
        if (!turno || !validTurnos.includes(turno)) {
            throw new Error('El turno debe ser "primero" o "segundo".');
        }
        this.turno = turno;
        return this;
    }

    public setFrente(frente: string): QRBuilder {
        const frenteRegex = /^[a-zA-Z0-9]{4}$/;
        if (!frente || !frenteRegex.test(frente)) {
            throw new Error('El frente debe ser un valor de 4 caracteres alfanuméricos.');
        }
        this.frente = frente;
        return this;
    }

    public generateQR(): void {
        // Aquí implementarás la lógica para generar el QR en el futuro.
    }

    private isComplete(): boolean {
        return (
            this.placas !== null &&
            this.idcamion !== null &&
            this.operador !== null &&
            this.turno !== null &&
            this.frente !== null
        );
    }
}

// Exporta la clase para que pueda ser utilizada en otras partes de la aplicación
export default QRBuilder;
