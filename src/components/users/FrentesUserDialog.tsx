"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, ChevronRight, Loader2, Search } from "lucide-react";
import { getProject } from "@/helpers/strings";
import type { UserRow } from "@/types";
import whiteLabelConfig from "#/white-label.config";

interface FrentesUserDialogProps {
  user: UserRow;
  frentes: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FrentesUserDialog({
  user,
  frentes,
  open,
  onOpenChange,
  onSuccess,
}: FrentesUserDialogProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelected([...user.frentes]);
      setSearch("");
      setOpenGroups(new Set());
      setError(null);
    }
  }, [open, user]);

  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const frente of frentes) {
      const project = getProject(frente);
      if (!map[project]) map[project] = [];
      map[project].push(frente);
    }
    return map;
  }, [frentes]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    const result: Record<string, string[]> = {};
    for (const [project, list] of Object.entries(grouped)) {
      if (project.toLowerCase().includes(q)) {
        result[project] = list;
      } else {
        const matches = list.filter((f) => f.toLowerCase().includes(q));
        if (matches.length > 0) result[project] = matches;
      }
    }
    return result;
  }, [grouped, search]);

  const toggleGroup = (project: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(project)) next.delete(project);
      else next.add(project);
      return next;
    });
  };

  const isGroupOpen = (project: string) =>
    search.trim() ? true : openGroups.has(project);

  const handleToggle = (frente: string) => {
    setSelected((prev) =>
      prev.includes(frente) ? prev.filter((f) => f !== frente) : [...prev, frente]
    );
  };

  const handleSubmit = async () => {
    const original = new Set(user.frentes);
    const next = new Set(selected);

    const add = [...next].filter((f) => !original.has(f));
    const remove = [...original].filter((f) => !next.has(f));

    if (add.length === 0 && remove.length === 0) {
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/assign-frentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, add, remove }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message?.includes("already has")) {
          setError("Uno o más frentes ya están asignados.");
        } else {
          setError("Error al actualizar los frentes.");
        }
        return;
      }

      toast({
        title: "Frentes actualizados",
        description: `Los frentes de ${user.username} fueron actualizados.`,
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const projectEntries = Object.entries(filteredGroups);
  const noResults = search.trim() !== "" && projectEntries.length === 0;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isLoading) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{(whiteLabelConfig as any)?.ui?.users?.actions?.manageFrentesTitle || "Gestionar frentes"}</DialogTitle>
          <DialogDescription>
            {(whiteLabelConfig as any)?.ui?.users?.frentesDialog?.descriptionPrefix || "Asigna o quita frentes al usuario"}{" "}
            <span className="font-mono font-semibold">{user.username}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {frentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{(whiteLabelConfig as any)?.ui?.frentesManager?.noRegistered || "No hay frentes registrados."}</p>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={(whiteLabelConfig as any)?.ui?.users?.create?.searchPlaceholder || "Buscar proyecto o frente..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 shadow-sm"
                />
              </div>

              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {noResults ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {(whiteLabelConfig as any)?.ui?.frentesManager?.noResultsPrefix || "Sin resultados para"} &quot;{search}&quot;
                  </p>
                ) : (
                  projectEntries.map(([project, list]) => {
                    const selectedInGroup = list.filter((f) => selected.includes(f)).length;
                    const isOpen = isGroupOpen(project);

                    return (
                      <div
                        key={project}
                        className="rounded-md border border-primary/40 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => toggleGroup(project)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-primary/5 rounded-md transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            {project}
                          </span>
                          {selectedInGroup > 0 && (
                            <span className="text-xs bg-secondary text-white rounded-full px-2 py-0.5">
                              {selectedInGroup}/{list.length}
                            </span>
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-3 pb-2 space-y-2 border-t border-primary/30 pt-2 bg-gray-50">
                            {list.map((frente) => {
                              const subLabel = frente.substring(project.length + 1);
                              return (
                                <div key={frente} className="flex items-center gap-3 pl-4">
                                  <Checkbox
                                    id={`fd-${frente}`}
                                    checked={selected.includes(frente)}
                                    onCheckedChange={() => handleToggle(frente)}
                                    className="data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-white"
                                  />
                                  <Label
                                    htmlFor={`fd-${frente}`}
                                    className="cursor-pointer font-normal text-sm"
                                  >
                                    {subLabel}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-secondary hover:bg-secondary/90 active:bg-secondary/80"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Guardando..." : "Confirmar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FrentesUserDialog;
