"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import type { UserRow } from "@/types";
import whiteLabelConfig from "../../../white-label.config";

interface EditUserDialogProps {
  user: UserRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const FORM_INITIAL = {
  nombre: "",
  apPaterno: "",
  apMaterno: "",
  noEmpleado: "",
  rol: "",
};

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: EditUserDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(FORM_INITIAL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        nombre: user.nombre,
        apPaterno: user.apPaterno,
        apMaterno: user.apMaterno ?? "",
        noEmpleado: user.noEmpleado,
        rol: user.rol,
      });
      setError(null);
    }
  }, [open, user]);

  const handleFieldChange = (field: keyof typeof FORM_INITIAL, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { nombre, apPaterno, noEmpleado, rol } = form;

    if (!nombre || !apPaterno || !noEmpleado || !rol) {
      setError((whiteLabelConfig as any)?.ui?.users?.form?.requiredFields || "Completa todos los campos obligatorios.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/${user.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apPaterno,
          apMaterno: form.apMaterno || undefined,
          noEmpleado,
          rol,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message?.includes("not found")) {
          setError("Usuario no encontrado.");
        } else {
          setError("Error al actualizar el usuario.");
        }
        return;
      }

      toast({
        title: "Usuario actualizado",
        description: `Los datos de ${user.username} fueron actualizados.`,
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

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isLoading) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{(whiteLabelConfig as any)?.ui?.users?.actions?.editTitle || "Editar usuario"}</DialogTitle>
          <DialogDescription>
            {(whiteLabelConfig as any)?.ui?.users?.editDialog?.descriptionPrefix || "Modifica los datos de"}{" "}
            <span className="font-mono font-semibold">{user.username}</span>.
            {(whiteLabelConfig as any)?.ui?.users?.editDialog?.descriptionSuffix || " El nombre de usuario no puede cambiarse."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 py-4">

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-nombre">{(whiteLabelConfig as any)?.ui?.users?.create?.nameLabel || "Nombre(s) *"}</Label>
              <Input
                id="edit-nombre"
                value={form.nombre}
                onChange={(e) => handleFieldChange("nombre", e.target.value)}
                className="shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-noEmpleado">{(whiteLabelConfig as any)?.ui?.users?.create?.employeeLabel || "No. de empleado *"}</Label>
              <Input
                id="edit-noEmpleado"
                value={form.noEmpleado}
                onChange={(e) => handleFieldChange("noEmpleado", e.target.value)}
                className="shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-apPaterno">{(whiteLabelConfig as any)?.ui?.users?.create?.firstSurnameLabel || "Apellido paterno *"}</Label>
              <Input
                id="edit-apPaterno"
                value={form.apPaterno}
                onChange={(e) => handleFieldChange("apPaterno", e.target.value)}
                className="shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-apMaterno">
                {(whiteLabelConfig as any)?.ui?.users?.create?.secondSurnameLabel || "Apellido materno"}{" "}
                <span className="text-muted-foreground font-normal">{(whiteLabelConfig as any)?.ui?.users?.create?.secondSurnameOptional || "(opcional)"}</span>
              </Label>
              <Input
                id="edit-apMaterno"
                value={form.apMaterno}
                onChange={(e) => handleFieldChange("apMaterno", e.target.value)}
                className="shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="edit-rol">{(whiteLabelConfig as any)?.ui?.users?.create?.roleLabel || "Rol *"}</Label>
              <Select
                value={form.rol}
                onValueChange={(v) => handleFieldChange("rol", v)}
              >
                <SelectTrigger id="edit-rol" className="shadow-sm">
                  <SelectValue placeholder={(whiteLabelConfig as any)?.ui?.users?.create?.rolePlaceholder || "Selecciona un rol"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{(whiteLabelConfig as any)?.ui?.users?.create?.roleUser || "Checador"}</SelectItem>
                  <SelectItem value="admin">{(whiteLabelConfig as any)?.ui?.users?.create?.roleAdmin || "IRO"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {error && (
            <p className="text-sm text-red-500 mb-3">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-secondary hover:bg-secondary/90 active:bg-secondary/80"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? (whiteLabelConfig as any)?.ui?.general?.saving || "Guardando..." : (whiteLabelConfig as any)?.ui?.users?.editDialog?.saveChanges || "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditUserDialog;
