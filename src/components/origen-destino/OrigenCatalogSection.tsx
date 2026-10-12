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
  getOrigenes,
  createOrigen,
  deactivateOrigen,
  renameOrigen,
} from "@/actions/origenes";
import { MOBILE_STATIC_ORIGENES } from "@/constants/mobileCatalogs";
import whiteLabelConfig from "#/white-label.config";

type Origen = {
  id: string;
  nombre: string;
  isActive: boolean;
};

interface OrigenCatalogSectionProps {
  onCatalogChange?: () => void;
}

export function OrigenCatalogSection({
  onCatalogChange,
}: OrigenCatalogSectionProps) {
  const [origenes, setOrigenes] = useState<Origen[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrigenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrigenes = async () => {
    try {
      setLoading(true);
      const data = await getOrigenes();
      setOrigenes(data);
    } catch {
      toast({
        title: "Error",
        description: (whiteLabelConfig as any)?.ui?.origenes?.toast?.errorDescription || "No se pudieron cargar los orígenes",
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
      const origen = await createOrigen(nombre);
      setOrigenes((prev) => {
        const filtered = prev.filter((m) => m.id !== origen.id);
        return [...filtered, origen].sort((a, b) =>
          a.nombre.localeCompare(b.nombre),
        );
      });
      if (inputRef.current) inputRef.current.value = "";
      toast({
        title: (whiteLabelConfig as any)?.ui?.origenes?.catalog?.createdTitle || "Origen creado",
        description: ((whiteLabelConfig as any)?.ui?.origenes?.catalog?.createdDescription || '"{name}" agregado al catálogo').replace("{name}", origen.nombre),
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
      await deactivateOrigen(id);
      setOrigenes((prev) => prev.filter((m) => m.id !== id));
      toast({
        title: (whiteLabelConfig as any)?.ui?.origenes?.catalog?.deletedTitle || "Origen eliminado",
        description: ((whiteLabelConfig as any)?.ui?.origenes?.catalog?.deletedDescription || '"{name}" ha sido eliminado del catálogo').replace("{name}", nombre),
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

  const startEditing = (origen: Origen) => {
    setEditingId(origen.id);
    setEditingValue(origen.nombre);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const handleRename = async (id: string) => {
    if (!editingValue.trim()) return;
    try {
      setRenaming(true);
      const updated = await renameOrigen(id, editingValue);
      setOrigenes((prev) =>
        prev
          .map((m) => (m.id === updated.id ? updated : m))
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      setEditingId(null);
      toast({
        title: (whiteLabelConfig as any)?.ui?.origenes?.catalog?.updatedTitle || "Origen actualizado",
        description: ((whiteLabelConfig as any)?.ui?.origenes?.catalog?.updatedDescription || 'Renombrado a "{name}"').replace("{name}", updated.nombre),
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

  const activeOrigenes = origenes.filter((m) => m.isActive);

  return (
    <div className="border-2 border-primary rounded-lg overflow-hidden">
      <div className="bg-primary px-4 py-3">
        <h2 className="text-lg font-semibold text-accent">
          {(whiteLabelConfig as any)?.ui?.origenes?.catalog?.heading || "Catálogo de Orígenes"}
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Add origen form */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={(whiteLabelConfig as any)?.ui?.origenes?.catalog?.inputPlaceholder || "Nombre del origen"}
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

        {/* Origenes list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : activeOrigenes.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            {(whiteLabelConfig as any)?.ui?.origenes?.catalog?.empty || "No hay orígenes en el catálogo. Agrega uno."}
          </p>
        ) : (
          <div className="space-y-1">
            {activeOrigenes.map((origen) => (
              <div
                key={origen.id}
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
              >
                {editingId === origen.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <Input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => handleRenameKeyDown(e, origen.id)}
                      disabled={renaming}
                      className="h-7 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-600 hover:text-green-700 shrink-0"
                      onClick={() => handleRename(origen.id)}
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
                    <span className="text-sm font-medium">{origen.nombre}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-primary"
                        onClick={() => startEditing(origen)}
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
                              {(whiteLabelConfig as any)?.ui?.origenes?.catalog?.deleteDialogTitle || "Eliminar origen"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {(((whiteLabelConfig as any)?.ui?.origenes?.catalog?.deleteDialogDescription || '¿Estás seguro que deseas eliminar "{name}"? Se removerá de todos los frentes asignados.').replace("{name}", origen.nombre))}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {(whiteLabelConfig as any)?.ui?.origenes?.catalog?.deleteDialogCancel || "Cancelar"}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeactivate(origen.id, origen.nombre)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {(whiteLabelConfig as any)?.ui?.origenes?.catalog?.deleteDialogConfirm || "Eliminar"}
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

        {/* Static mobile catalog entries (read-only) */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Catálogo general (app móvil)
          </h3>
          <div className="space-y-1">
            {MOBILE_STATIC_ORIGENES.map((nombre) => (
              <div
                key={nombre}
                className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-50"
              >
                <span className="text-sm text-slate-400">{nombre}</span>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  General
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
