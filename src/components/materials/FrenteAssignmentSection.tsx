"use client";

import { useCallback, useEffect, useState, type MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Loader2 } from "lucide-react";
import {
  getFrenteMaterials,
  assignMaterialToFrente,
  unassignMaterialFromFrente,
} from "@/actions/materials";

type MaterialItem = {
  id: string;
  nombre: string;
};

interface FrenteAssignmentSectionProps {
  frentes: string[];
  refreshRef?: MutableRefObject<(() => void) | null>;
}

export function FrenteAssignmentSection({
  frentes,
  refreshRef,
}: FrenteAssignmentSectionProps) {
  const [selectedFrente, setSelectedFrente] = useState<string>("");
  const [assigned, setAssigned] = useState<MaterialItem[]>([]);
  const [available, setAvailable] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadFrenteMaterials = useCallback(async (frente: string) => {
    try {
      setLoading(true);
      const data = await getFrenteMaterials(frente);
      setAssigned(data.assigned);
      setAvailable(data.available);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales del frente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedFrente) {
      loadFrenteMaterials(selectedFrente);
    } else {
      setAssigned([]);
      setAvailable([]);
    }
  }, [selectedFrente, loadFrenteMaterials]);

  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = () => {
        if (selectedFrente) loadFrenteMaterials(selectedFrente);
      };
    }
  }, [refreshRef, selectedFrente, loadFrenteMaterials]);

  const handleAssign = async (material: MaterialItem) => {
    try {
      await assignMaterialToFrente(material.id, selectedFrente);
      setAssigned((prev) =>
        [...prev, material].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setAvailable((prev) => prev.filter((m) => m.id !== material.id));
      toast({
        title: "Material asignado",
        description: `"${material.nombre}" asignado a ${selectedFrente}`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnassign = async (material: MaterialItem) => {
    try {
      await unassignMaterialFromFrente(material.id, selectedFrente);
      setAvailable((prev) =>
        [...prev, material].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setAssigned((prev) => prev.filter((m) => m.id !== material.id));
      toast({
        title: "Material removido",
        description: `"${material.nombre}" removido de ${selectedFrente}`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-2 border-primary-light rounded-lg overflow-hidden">
      <div className="bg-primary px-4 py-3">
        <h2 className="text-lg font-semibold text-accent">
          Materiales por Frente
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Frente selector */}
        <Select value={selectedFrente} onValueChange={setSelectedFrente}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un frente" />
          </SelectTrigger>
          <SelectContent>
            {frentes.map((frente) => (
              <SelectItem key={frente} value={frente}>
                {frente}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!selectedFrente ? (
          <p className="text-center text-slate-500 py-8">
            Selecciona un frente para gestionar sus materiales.
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Assigned materials */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Asignados ({assigned.length})
              </p>
              {assigned.length === 0 ? (
                <p className="text-sm text-slate-400 px-2">
                  Sin materiales asignados
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {assigned.map((material) => (
                    <Badge
                      key={material.id}
                      variant="outline"
                      className="pl-3 pr-1 py-1 border-primary-light text-sm flex items-center gap-1"
                    >
                      {material.nombre}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-red-100 hover:text-red-600"
                        onClick={() => handleUnassign(material)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Available materials */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Disponibles ({available.length})
              </p>
              {available.length === 0 ? (
                <p className="text-sm text-slate-400 px-2">
                  Todos los materiales ya están asignados
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {available.map((material) => (
                    <Badge
                      key={material.id}
                      variant="secondary"
                      className="pl-3 pr-1 py-1 text-sm flex items-center gap-1"
                    >
                      {material.nombre}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-green-100 hover:text-green-600"
                        onClick={() => handleAssign(material)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
