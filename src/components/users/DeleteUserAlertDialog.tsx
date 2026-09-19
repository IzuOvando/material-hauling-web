"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import whiteLabelConfig from "../../../white-label.config";

interface DeleteUserAlertDialogProps {
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (username: string) => void;
}

export function DeleteUserAlertDialog({
  username,
  open,
  onOpenChange,
  onDelete,
}: DeleteUserAlertDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/${username}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? ((whiteLabelConfig as any)?.ui?.users?.deleteDialog?.genericError || "No se pudo eliminar el usuario."));
        return;
      }

      toast({
        title: (whiteLabelConfig as any)?.ui?.users?.deleteDialog?.successTitle || "Usuario eliminado",
        description: ((whiteLabelConfig as any)?.ui?.users?.deleteDialog?.successDescription || "El usuario {username} fue eliminado correctamente.").replace("{username}", username),
        variant: "success",
      });
      onDelete(username);
      onOpenChange(false);
    } catch {
      setError((whiteLabelConfig as any)?.ui?.users?.deleteDialog?.connectionError || "Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading) return;
    if (!nextOpen) setError(null);
    onOpenChange(nextOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {(whiteLabelConfig as any)?.ui?.users?.deleteDialog?.titlePrefix || "¿Eliminar al usuario"}{" "}
            <span className="font-mono">{username}</span>?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {(whiteLabelConfig as any)?.ui?.users?.deleteDialog?.description || "Esta acción es permanente y no se puede deshacer. Se eliminarán todos los datos del usuario del sistema."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-red-500 -mt-1">{error}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{(whiteLabelConfig as any)?.ui?.users?.deleteDialog?.cancel || "Cancelar"}</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? ((whiteLabelConfig as any)?.ui?.users?.deleteDialog?.deleting || "Eliminando...") : ((whiteLabelConfig as any)?.ui?.users?.deleteDialog?.confirm || "Sí, eliminar")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteUserAlertDialog;
