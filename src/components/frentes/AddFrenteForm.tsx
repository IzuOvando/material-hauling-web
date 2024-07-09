"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const AddFrenteForm: React.FC = () => {
  const [newFrenteName, setNewFrenteName] = useState("");
  const { toast } = useToast();

  const handleAddFrente = async () => {
    const trimmedName = newFrenteName.trim().toUpperCase();

    if (trimmedName === "") {
      toast({
        title: "Error",
        description: "El nombre del frente no puede estar vacío.",
        variant: "destructive"
      });
      return;
    }

    if (!/^[A-Z0-9]{4}$/.test(trimmedName)) {
      toast({
        title: "Error",
        description: "El nombre del frente debe ser de 4 caracteres alfanuméricos.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/files/addfrente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: trimmedName }),
      });

      if (!response.ok) {
        throw new Error("Error en la solicitud");
      }

      toast({
        title: "Éxito",
        description: `Frente ${newFrenteName} creado con éxito.`,
        variant: "success"
      });
      setTimeout(() => window.location.reload(), 2500);
      setNewFrenteName("");
    } catch (error) {
      console.error("Error al crear nuevo frente:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el nuevo frente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Añadir nuevo frente"
        value={newFrenteName}
        onChange={(e) => setNewFrenteName(e.target.value)}
        className="input text-input"
      />
      <Button onClick={handleAddFrente}>Añadir</Button>
    </div>
  );
};

export default AddFrenteForm;
