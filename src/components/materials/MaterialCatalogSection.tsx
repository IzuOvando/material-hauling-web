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
import { Trash2, Plus, Loader2 } from "lucide-react";
import {
  getMaterials,
  createMaterial,
  deactivateMaterial,
} from "@/actions/materials";

type Material = {
  id: string;
  nombre: string;
  isActive: boolean;
};

interface MaterialCatalogSectionProps {
  onCatalogChange?: () => void;
}

export function MaterialCatalogSection({
  onCatalogChange,
}: MaterialCatalogSectionProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await getMaterials();
      setMaterials(data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales",
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
      const material = await createMaterial(nombre);
      setMaterials((prev) => {
        const filtered = prev.filter((m) => m.id !== material.id);
        return [...filtered, material].sort((a, b) =>
          a.nombre.localeCompare(b.nombre),
        );
      });
      if (inputRef.current) inputRef.current.value = "";
      toast({
        title: "Material creado",
        description: `"${material.nombre}" agregado al catálogo`,
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
      await deactivateMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast({
        title: "Material eliminado",
        description: `"${nombre}" ha sido eliminado del catálogo`,
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

  const activeMaterials = materials.filter((m) => m.isActive);

  return (
    <div className="border-2 border-primary-light rounded-lg overflow-hidden">
      <div className="bg-primary px-4 py-3">
        <h2 className="text-lg font-semibold text-accent">
          Catálogo de Materiales
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Add material form */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Nombre del material"
            onKeyDown={handleKeyDown}
            disabled={creating}
          />
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-accent hover:bg-accent-light text-white shrink-0"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Materials list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : activeMaterials.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            No hay materiales en el catálogo. Agrega uno.
          </p>
        ) : (
          <div className="space-y-1">
            {activeMaterials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
              >
                <span className="text-sm font-medium">{material.nombre}</span>
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
                      <AlertDialogTitle>Eliminar material</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro que deseas eliminar &quot;
                        {material.nombre}&quot;? Se removerá de todos los
                        frentes asignados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          handleDeactivate(material.id, material.nombre)
                        }
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
