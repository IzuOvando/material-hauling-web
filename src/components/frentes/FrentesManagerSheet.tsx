"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2, Layers, Search, ChevronDown } from "lucide-react";
import type { Frente } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getAllFreentes } from "@/actions/frentes";
import AddFrenteDialog from "./AddFrenteDialog";
import EditFrenteDialog from "./EditFrenteDialog";
import whiteLabelConfig from "../../../white-label.config";

function groupByProject(frentes: Frente[]): Map<string, Frente[]> {
  const map = new Map<string, Frente[]>();
  for (const f of frentes) {
    const project = f.nombre.split(/-F\d/)[0] ?? f.nombre;
    const list = map.get(project) ?? [];
    list.push(f);
    map.set(project, list);
  }
  return map;
}

export function FrentesManagerSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [frentes, setFreentes] = useState<Frente[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [openAdd, setOpenAdd] = useState(false);
  const [editingFrente, setEditingFrente] = useState<Frente | null>(null);

  const fetchFreentes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllFreentes();
      setFreentes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      fetchFreentes();
      setSearch("");
      setCollapsed(new Set());
    }
  };

  const handleRefresh = () => {
    fetchFreentes();
    router.refresh();
  };

  const handleDeleteFrente = (nombre: string) => {
    setFreentes((prev) => prev.filter((f) => f.nombre !== nombre));
    router.refresh();
  };

  const toggleProject = (project: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(project) ? next.delete(project) : next.add(project);
      return next;
    });
  };

  const allGrouped = useMemo(() => groupByProject(frentes), [frentes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allGrouped;
    const result = new Map<string, Frente[]>();
    for (const [project, pFrentes] of allGrouped) {
      const displayName = pFrentes.find((f) => f.displayName)?.displayName ?? "";
      const projectMatches =
        project.toLowerCase().includes(q) || displayName.toLowerCase().includes(q);
      const matching = projectMatches
        ? pFrentes
        : pFrentes.filter((f) => f.nombre.toLowerCase().includes(q));
      if (matching.length > 0) result.set(project, matching);
    }
    return result;
  }, [allGrouped, search]);

  const isSearching = search.trim().length > 0;

  const getSiblingDisplayName = (frente: Frente): string | null => {
    const project = frente.nombre.split(/-F\d/)[0] ?? frente.nombre;
    return (
      frentes.find(
        (f) =>
          f.nombre !== frente.nombre &&
          f.nombre.startsWith(project) &&
          f.displayName
      )?.displayName ?? null
    );
  };

  return (
    <>
      <button
        onClick={() => handleOpenChange(true)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group w-full text-foreground/70 hover:bg-muted/60"
      >
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 bg-accent/10 group-hover:bg-accent/20 group-hover:scale-110">
          <Layers className="h-4 w-4 shrink-0 transition-colors text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{(whiteLabelConfig as any)?.ui?.frentesManager?.title || 'Gestionar Frentes'}</p>
          <p className="text-xs leading-tight mt-0.5 truncate text-muted-foreground">
            {(whiteLabelConfig as any)?.ui?.frentesManager?.description || 'Añadir, editar o eliminar'}
          </p>
        </div>
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
            <SheetTitle>Gestionar Frentes</SheetTitle>
            <SheetDescription>
              Administra los frentes del sistema — añade, edita o elimina.
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-3 shrink-0 flex flex-col gap-3">
            <Button
              className="w-full flex items-center gap-2 bg-accent hover:bg-accent-dark text-white"
              onClick={() => setOpenAdd(true)}
            >
              <Plus className="h-4 w-4" />
              {(whiteLabelConfig as any)?.ui?.frentesManager?.newButton || 'Nuevo Frente'}
            </Button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={(whiteLabelConfig as any)?.ui?.frentesManager?.searchPlaceholder || "Buscar frente o proyecto…"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white",
                  "placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50",
                  "transition-colors duration-150"
                )}
              />
            </div>
          </div>

          <Separator className="shrink-0" />

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : frentes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">
                {(whiteLabelConfig as any)?.ui?.frentesManager?.noRegistered || "No hay frentes registrados."}
              </p>
            ) : filtered.size === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">
                {(whiteLabelConfig as any)?.ui?.frentesManager?.noResultsPrefix || "Sin resultados para"}{" "}
                <span className="font-semibold">&quot;{search}&quot;</span>
              </p>
            ) : (
              <div className="space-y-4">
                {Array.from(filtered.entries()).map(([project, projectFreentes]) => {
                  const isCollapsed = !isSearching && collapsed.has(project);
                  const displayName =
                    projectFreentes.find((f) => f.displayName)?.displayName ?? null;

                  return (
                    <div key={project}>
                      {/* Project header — collapsible */}
                      <button
                        onClick={() => toggleProject(project)}
                        className="w-full flex items-center gap-2 mb-1.5 group/header"
                      >
                        <div className="w-0.5 h-4 rounded-full bg-accent/50 group-hover/header:bg-accent shrink-0 transition-colors duration-150" />
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          {displayName && (
                            <span className="text-xs font-bold text-primary leading-tight truncate">
                              {displayName}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 leading-tight">
                            {project}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0">
                          {projectFreentes.length}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-150",
                            isCollapsed && "-rotate-90"
                          )}
                        />
                      </button>

                      {!isCollapsed && (
                        <div className="space-y-1">
                          {projectFreentes.map((frente) => (
                            <div
                              key={frente.nombre}
                              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-colors"
                            >
                              <span className="text-sm font-semibold text-slate-800 truncate">
                                {frente.nombre}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-slate-400 hover:text-secondary hover:bg-secondary/10"
                                onClick={() => setEditingFrente(frente)}
                                title={(whiteLabelConfig as any)?.ui?.frentesManager?.editTitle || 'Editar frente'}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AddFrenteDialog
        open={openAdd}
        setOpen={(v) => {
          setOpenAdd(v);
          if (!v) handleRefresh();
        }}
      />

      {editingFrente && (
        <EditFrenteDialog
          open={!!editingFrente}
          setOpen={(v) => {
            if (!v) setEditingFrente(null);
          }}
          frente={editingFrente}
          isOwner
          siblingDisplayName={getSiblingDisplayName(editingFrente)}
          onFrenteUpdated={handleRefresh}
          onLogoUpdated={handleRefresh}
          onDeleteFrente={(nombre) => {
            setEditingFrente(null);
            handleDeleteFrente(nombre);
          }}
        />
      )}
    </>
  );
}
