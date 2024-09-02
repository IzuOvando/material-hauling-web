class QRBuilder {

    private placas: string | null = null;
    private noeconomico: string | null = null;
    private operador: string | null = null;
    private turno: number | null = null;
    private frente: string | null = null;
    private volumen: number | null = null;
    private idcamion: string | null = null;

    constructor() { }

    public setPlacas(placas: string): QRBuilder {
        if (!placas || placas.trim() === '') {
            throw new Error('Las placas son requeridas y no pueden estar vacías.');
        }
        this.placas = placas;
        return this;
    }

    public setVolumen(volumen: number): QRBuilder {
        if (volumen <= 0) {
            throw new Error('El volumen es requerido y debe ser mayor a 0.');
        }
        this.volumen = volumen;
        return this;
    }

    public setNoeconomico(noeconomico: string): QRBuilder {
        if (!noeconomico || noeconomico.trim() === '') {
            throw new Error('El No. Economico es requerido y no puede estar vacío.');
        }
        this.noeconomico = noeconomico;
        return this;
    }

    public setOperador(operador: string): QRBuilder {
        if (!operador || operador.trim() === '') {
            throw new Error('El operador es requerido y no puede estar vacío.');
        }
        this.operador = operador;
        return this;
    }

    public setTurno(turno: number): QRBuilder {
        const validTurnos = [1, 2];
        if (!validTurnos.includes(turno)) {
            throw new Error('El turno debe ser 1 o 2.');
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

    private setIdcamion(): void {
        if (this.frente && this.noeconomico) {
            this.idcamion = `TM-${this.frente}-${this.noeconomico}`;
        } else {
            throw new Error('Frente y No Economico deben estar establecidos para generar el ID del camión.');
        }
    }

    public generateQR(): void {
        if (!this.isComplete()) {
            throw new Error('Faltan campos requeridos para generar el QR.');
        }
        this.setIdcamion();
    }

    private isComplete(): boolean {
        return (
            this.placas !== null &&
            this.noeconomico !== null &&
            this.idcamion !== null &&
            this.operador !== null &&
            this.turno !== null &&
            this.frente !== null &&
            this.volumen !== null
        );
    }
}

export default QRBuilder;
