'use client';
import React from 'react';
import FileUpload from "@/components/upload/UploadInput";
import FileUpdate from "@/components/upload/UpdateInput";
import useFrenteStore from '@/store/useFrenteStore';
import { Frente as PrismaFrente } from '@prisma/client';
import { Ticket } from '@prisma/client';

type Frente = PrismaFrente & {
    tickets?: Ticket[];
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


