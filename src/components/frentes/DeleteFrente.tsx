"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Frente } from "@/types";

const RemoveFrenteForm: React.FC<{ frentes: Frente[] }> = ({ frentes }) => {
    const [selectedFrente, setSelectedFrente] = useState("");

    const { toast } = useToast();

    const handleRemoveFrente = async () => {
        if (selectedFrente === "") {
            toast({
                title: "Error",
                description: "Debe seleccionar un frente para eliminar.",
                variant: "destructive"
            });
            return;
        }

        try {
            const response = await fetch('/api/files/deletefrente', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombre: selectedFrente }),
            });

            if (!response.ok) {
                throw new Error("Error en la solicitud");
            }

            toast({
                title: "Éxito",
                description: `Frente eliminado con éxito.`,
                variant: "success"
            });
            setTimeout(() => window.location.reload(), 2500);
        } catch (error) {
            console.error("Error al eliminar el frente:", error);
            toast({
                title: "Error",
                description: "No se pudo eliminar el frente.",
                variant: "destructive"
            });
        }
    };

    return (
        <div>
            <select
                value={selectedFrente}
                onChange={(e) => setSelectedFrente(e.target.value)}
                className="select select-bordered w-full max-w-xs"
            >
                <option value="">Seleccione un frente</option>
                {frentes.map((frente) => (
                    <option key={frente.nombre} value={frente.nombre}>{frente.nombre}</option>
                ))}
            </select>
            <Button onClick={handleRemoveFrente}>Eliminar</Button>
        </div>
    );
};

export default RemoveFrenteForm;

