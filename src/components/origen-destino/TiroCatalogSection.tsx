"use client";

import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, Loader2, Pencil, Check, X } from "lucide-react";
import {
  getTiros,
  createTiro,
  deactivateTiro,
  renameTiro,
} from "@/actions/tiros";
import whiteLabelConfig from "#/white-label.config";

type Tiro = {
  id: string;
  nombre: string;
  isActive: boolean;
};

interface TiroCatalogSectionProps {
  onCatalogChange?: () => void;
}

export function TiroCatalogSection({
  onCatalogChange,
}: TiroCatalogSectionProps) {
  const [tiros, setTiros] = useState<Tiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTiros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTiros = async () => {
    try {
      setLoading(true);
      const data = await getTiros();
      setTiros(data);
    } catch {
      toast({
        title: "Error",
        description: (whiteLabelConfig as any)?.ui?.tiros?.toast?.errorDescription || "No se pudieron cargar los tiros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const nombre = inputRef.current?.value?.trim();
    if (!nombre) return;

    try {
      setCreating(true);
      const tiro = await createTiro(nombre);
      setTiros((prev) => {
        const filtered = prev.filter((m) => m.id !== tiro.id);
        return [...filtered, tiro].sort((a, b) =>
          a.nombre.localeCompare(b.nombre),
        );
      });
      if (inputRef.current) inputRef.current.value = "";
      toast({
        title: (whiteLabelConfig as any)?.ui?.tiros?.catalog?.createdTitle || "Tiro creado",
        description: ((whiteLabelConfig as any)?.ui?.tiros?.catalog?.createdDescription || '"{name}" agregado al catálogo').replace("{name}", tiro.nombre),
        variant: "success",
      });
      onCatalogChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string, nombre: string) => {
    try {
      await deactivateTiro(id);
      setTiros((prev) => prev.filter((m) => m.id !== id));
      toast({
        title: (whiteLabelConfig as any)?.ui?.tiros?.catalog?.deletedTitle || "Tiro eliminado",
        description: ((whiteLabelConfig as any)?.ui?.tiros?.catalog?.deletedDescription || '"{name}" ha sido eliminado del catálogo').replace("{name}", nombre),
        variant: "success",
      });
      onCatalogChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreate();
  };

  const startEditing = (tiro: Tiro) => {
    setEditingId(tiro.id);
    setEditingValue(tiro.nombre);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const handleRename = async (id: string) => {
    if (!editingValue.trim()) return;
    try {
      setRenaming(true);
      const updated = await renameTiro(id, editingValue);
      setTiros((prev) =>
        prev
          .map((m) => (m.id === updated.id ? updated : m))
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      setEditingId(null);
      toast({
        title: (whiteLabelConfig as any)?.ui?.tiros?.catalog?.updatedTitle || "Tiro actualizado",
        description: ((whiteLabelConfig as any)?.ui?.tiros?.catalog?.updatedDescription || 'Renombrado a "{name}"').replace("{name}", updated.nombre),
        variant: "success",
      });
      onCatalogChange?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setRenaming(false);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") handleRename(id);
    if (e.key === "Escape") cancelEditing();
  };

  const activeTiros = tiros.filter((m) => m.isActive);

  return (
    <div className="border-2 border-primary rounded-lg overflow-hidden">
      <div className="bg-primary px-4 py-3">
        <h2 className="text-lg font-semibold text-accent">
          {(whiteLabelConfig as any)?.ui?.tiros?.catalog?.heading || "Catálogo de Tiros"}
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Add tiro form */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={(whiteLabelConfig as any)?.ui?.tiros?.catalog?.inputPlaceholder || "Nombre del tiro"}
            onKeyDown={handleKeyDown}
            disabled={creating}
          />
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-accent hover:bg-accent/90 text-white shrink-0"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Tiros list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : activeTiros.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            {(whiteLabelConfig as any)?.ui?.tiros?.catalog?.empty || "No hay tiros en el catálogo. Agrega uno."}
          </p>
        ) : (
          <div className="space-y-1">
            {activeTiros.map((tiro) => (
              <div
                key={tiro.id}
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
              >
                {editingId === tiro.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <Input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => handleRenameKeyDown(e, tiro.id)}
                      disabled={renaming}
                      className="h-7 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-600 hover:text-green-700 shrink-0"
                      onClick={() => handleRename(tiro.id)}
                      disabled={renaming}
                    >
                      {renaming ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-slate-600 shrink-0"
                      onClick={cancelEditing}
                      disabled={renaming}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium">{tiro.nombre}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-primary"
                        onClick={() => startEditing(tiro)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {(whiteLabelConfig as any)?.ui?.tiros?.catalog?.deleteDialogTitle || "Eliminar tiro"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {(((whiteLabelConfig as any)?.ui?.tiros?.catalog?.deleteDialogDescription || '¿Estás seguro que deseas eliminar "{name}"? Se removerá de todos los frentes asignados.').replace("{name}", tiro.nombre))}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {(whiteLabelConfig as any)?.ui?.tiros?.catalog?.deleteDialogCancel || "Cancelar"}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeactivate(tiro.id, tiro.nombre)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {(whiteLabelConfig as any)?.ui?.tiros?.catalog?.deleteDialogConfirm || "Eliminar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
