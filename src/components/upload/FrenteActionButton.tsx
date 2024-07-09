'use client'
import React from 'react';
import FileUpload from "@/components/upload/UploadInput";
import FileUpdate from "@/components/upload/UpdateInput";
import useFrenteStore from "@/contexts/useFrenteStore";

type Frente = {
    nombre: string;
    tickets: Ticket[];
};

type Ticket = {
    uuid: string;
    empresa: string;
    material: string;
    cubicacion: string;
    fecha: string;
    placas: string;
    noEmpleado: string;
    idCamion: string;
    operador: string;
    checador: string;
    hora: string;
    proyecto: string;
    banco: string;
    createdAt: Date;
    frenteNombre: string;
    frente?: Frente;
};

type Props = {
    frentes: Frente[];
};

const FrenteActionButton: React.FC<Props> = ({ frentes }) => {
    const { selectedFrente } = useFrenteStore();

    if (!selectedFrente) {
        return <p>No selected frente.</p>;
    }

    const activeFrente = frentes.find(frente => frente.nombre === selectedFrente.nombre);

    if (!activeFrente) {
        return <p>Selected frente not found in the list.</p>;
    }

    return (
        <div>
            {activeFrente.tickets && activeFrente.tickets.length > 0 ? (
                <FileUpdate />
            ) : (
                <FileUpload />
            )}
        </div>
    );
};

export default FrenteActionButton;

