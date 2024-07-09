'use client'
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import useFrenteStore from "@/store/useFrenteStore";
import { Frente } from '@prisma/client';

const FrenteButtons: React.FC<{ frentes: Frente[] }> = ({ frentes }) => {
    const { selectedFrente, setSelectedFrente } = useFrenteStore();

    useEffect(() => {
        if (frentes.length > 0 && !selectedFrente) {
            setSelectedFrente(frentes[0]);
        }
    }, [frentes, selectedFrente, setSelectedFrente]);

    const handleButtonClick = (frente: Frente) => {
        setSelectedFrente(frente);
    };

    return (
        <div>
            <nav className="flex space-x-2">
                {frentes.map((frente) => (
                    <Button
                        key={frente.nombre}
                        onClick={() => handleButtonClick(frente)}
                        className={`p-2 text-sm ${selectedFrente && frente.nombre === selectedFrente.nombre ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
                    >
                        {frente.nombre}
                    </Button>
                ))}
            </nav>
            {selectedFrente && (
                <div className="mt-4 p-4 border border-gray-200 rounded shadow">
                    <h3 className="text-lg font-semibold">Frente seleccionado:</h3>
                    <p className="text-gray-700">{selectedFrente.nombre}</p>
                </div>
            )}
        </div>
    );
};

export default FrenteButtons;


