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
import whiteLabelConfig from "#/white-label.config";
import { Plus, X, Loader2 } from "lucide-react";
import {
  getFrenteOrigenes,
  assignOrigenToFrente,
  unassignOrigenFromFrente,
} from "@/actions/origenes";

type OrigenItem = {
  id: string;
  nombre: string;
};

interface FrenteOrigenAssignmentSectionProps {
  frentes: string[];
  refreshRef?: MutableRefObject<(() => void) | null>;
}

export function FrenteOrigenAssignmentSection({
  frentes,
  refreshRef,
}: FrenteOrigenAssignmentSectionProps) {
  const [selectedFrente, setSelectedFrente] = useState<string>("");
  const [assigned, setAssigned] = useState<OrigenItem[]>([]);
  const [available, setAvailable] = useState<OrigenItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadFrenteOrigenes = useCallback(async (frente: string) => {
    try {
      setLoading(true);
      const data = await getFrenteOrigenes(frente);
      setAssigned(data.assigned);
      setAvailable(data.available);
    } catch {
      toast({
        title: (whiteLabelConfig as any)?.ui?.origenes?.toast?.errorTitle || "Error",
        description: (whiteLabelConfig as any)?.ui?.origenes?.toast?.errorDescription || "No se pudieron cargar los orígenes del frente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedFrente) {
      loadFrenteOrigenes(selectedFrente);
    } else {
      setAssigned([]);
      setAvailable([]);
    }
  }, [selectedFrente, loadFrenteOrigenes]);

  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = () => {
        if (selectedFrente) loadFrenteOrigenes(selectedFrente);
      };
    }
  }, [refreshRef, selectedFrente, loadFrenteOrigenes]);

  const handleAssign = async (origen: OrigenItem) => {
    try {
      await assignOrigenToFrente(origen.id, selectedFrente);
      setAssigned((prev) =>
        [...prev, origen].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setAvailable((prev) => prev.filter((m) => m.id !== origen.id));
      toast({
        title: (whiteLabelConfig as any)?.ui?.origenes?.toast?.assignedTitle || "Origen asignado",
        description: `"${origen.nombre}" ${ (whiteLabelConfig as any)?.ui?.origenes?.toast?.assignedVerb || 'asignado a' } ${selectedFrente}`,
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

  const handleUnassign = async (origen: OrigenItem) => {
    try {
      await unassignOrigenFromFrente(origen.id, selectedFrente);
      setAvailable((prev) =>
        [...prev, origen].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setAssigned((prev) => prev.filter((m) => m.id !== origen.id));
      toast({
        title: (whiteLabelConfig as any)?.ui?.origenes?.toast?.removedTitle || "Origen removido",
        description: `"${origen.nombre}" ${ (whiteLabelConfig as any)?.ui?.origenes?.toast?.removedVerb || 'removido de' } ${selectedFrente}`,
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
    <div className="border-2 border-primary rounded-lg overflow-hidden">
      <div className="bg-primary px-4 py-3">
        <h2 className="text-lg font-semibold text-accent">
          {(whiteLabelConfig as any)?.ui?.origenes?.title || "Orígenes por Frente"}
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Frente selector */}
        <Select value={selectedFrente} onValueChange={setSelectedFrente}>
          <SelectTrigger>
            <SelectValue placeholder={(whiteLabelConfig as any)?.ui?.general?.searchPlaceholder ?? "Selecciona un frente"} />
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
            {(whiteLabelConfig as any)?.ui?.frenteSelector?.noAssignedSubtitle ?? "Selecciona un frente para gestionar sus orígenes."}
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Assigned origenes */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                {(whiteLabelConfig as any)?.ui?.origenes?.assignedLabel || "Asignados"} ({assigned.length})
              </p>
              {assigned.length === 0 ? (
                <p className="text-sm text-slate-400 px-2">
                  {(whiteLabelConfig as any)?.ui?.origenes?.emptyAssigned || "Sin orígenes asignados"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {assigned.map((origen) => (
                    <Badge
                      key={origen.id}
                      variant="outline"
                      className="pl-3 pr-1 py-1 border-primary text-sm flex items-center gap-1"
                    >
                      {origen.nombre}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-red-100 hover:text-red-600"
                        onClick={() => handleUnassign(origen)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Available origenes */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Disponibles ({available.length})
              </p>
              {available.length === 0 ? (
                <p className="text-sm text-slate-400 px-2">
                  {(whiteLabelConfig as any)?.ui?.origenes?.emptyAvailable || "Todos los orígenes ya están asignados"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {available.map((origen) => (
                    <Badge
                      key={origen.id}
                      variant="secondary"
                      className="pl-3 pr-1 py-1 text-sm flex items-center gap-1"
                    >
                      {origen.nombre}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-green-100 hover:text-green-600"
                        onClick={() => handleAssign(origen)}
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
