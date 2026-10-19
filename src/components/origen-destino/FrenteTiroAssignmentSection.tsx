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
  getFrenteTiros,
  assignTiroToFrente,
  unassignTiroFromFrente,
} from "@/actions/tiros";

type TiroItem = {
  id: string;
  nombre: string;
};

interface FrenteTiroAssignmentSectionProps {
  frentes: string[];
  refreshRef?: MutableRefObject<(() => void) | null>;
}

export function FrenteTiroAssignmentSection({
  frentes,
  refreshRef,
}: FrenteTiroAssignmentSectionProps) {
  const [selectedFrente, setSelectedFrente] = useState<string>("");
  const [assigned, setAssigned] = useState<TiroItem[]>([]);
  const [available, setAvailable] = useState<TiroItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadFrenteTiros = useCallback(async (frente: string) => {
    try {
      setLoading(true);
      const data = await getFrenteTiros(frente);
      setAssigned(data.assigned);
      setAvailable(data.available);
    } catch {
      toast({
        title: (whiteLabelConfig as any)?.ui?.tiros?.toast?.errorTitle || "Error",
        description: (whiteLabelConfig as any)?.ui?.tiros?.toast?.errorDescription || "No se pudieron cargar los tiros del frente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedFrente) {
      loadFrenteTiros(selectedFrente);
    } else {
      setAssigned([]);
      setAvailable([]);
    }
  }, [selectedFrente, loadFrenteTiros]);

  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = () => {
        if (selectedFrente) loadFrenteTiros(selectedFrente);
      };
    }
  }, [refreshRef, selectedFrente, loadFrenteTiros]);

  const handleAssign = async (tiro: TiroItem) => {
    try {
      await assignTiroToFrente(tiro.id, selectedFrente);
      setAssigned((prev) =>
        [...prev, tiro].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setAvailable((prev) => prev.filter((m) => m.id !== tiro.id));
      toast({
        title: (whiteLabelConfig as any)?.ui?.tiros?.toast?.assignedTitle || "Tiro asignado",
        description: `"${tiro.nombre}" ${ (whiteLabelConfig as any)?.ui?.tiros?.toast?.assignedVerb || 'asignado a' } ${selectedFrente}`,
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

  const handleUnassign = async (tiro: TiroItem) => {
    try {
      await unassignTiroFromFrente(tiro.id, selectedFrente);
      setAvailable((prev) =>
        [...prev, tiro].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setAssigned((prev) => prev.filter((m) => m.id !== tiro.id));
      toast({
        title: (whiteLabelConfig as any)?.ui?.tiros?.toast?.removedTitle || "Tiro removido",
        description: `"${tiro.nombre}" ${ (whiteLabelConfig as any)?.ui?.tiros?.toast?.removedVerb || 'removido de' } ${selectedFrente}`,
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
          {(whiteLabelConfig as any)?.ui?.tiros?.title || "Tiros por Frente"}
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
            {(whiteLabelConfig as any)?.ui?.frenteSelector?.noAssignedSubtitle ?? "Selecciona un frente para gestionar sus tiros."}
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Assigned tiros */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                {(whiteLabelConfig as any)?.ui?.tiros?.assignedLabel || "Asignados"} ({assigned.length})
              </p>
              {assigned.length === 0 ? (
                <p className="text-sm text-slate-400 px-2">
                  {(whiteLabelConfig as any)?.ui?.tiros?.emptyAssigned || "Sin tiros asignados"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {assigned.map((tiro) => (
                    <Badge
                      key={tiro.id}
                      variant="outline"
                      className="pl-3 pr-1 py-1 border-primary text-sm flex items-center gap-1"
                    >
                      {tiro.nombre}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-red-100 hover:text-red-600"
                        onClick={() => handleUnassign(tiro)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Available tiros */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                {(whiteLabelConfig as any)?.ui?.tiros?.assignment?.availableLabel || "Disponibles"} ({available.length})
              </p>
              {available.length === 0 ? (
                <p className="text-sm text-slate-400 px-2">
                  {(whiteLabelConfig as any)?.ui?.tiros?.emptyAvailable || "Todos los tiros ya están asignados"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {available.map((tiro) => (
                    <Badge
                      key={tiro.id}
                      variant="secondary"
                      className="pl-3 pr-1 py-1 text-sm flex items-center gap-1"
                    >
                      {tiro.nombre}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-green-100 hover:text-green-600"
                        onClick={() => handleAssign(tiro)}
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
