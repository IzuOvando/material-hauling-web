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
        setError(data.message ?? "No se pudo eliminar el usuario.");
        return;
      }

      toast({
        title: "Usuario eliminado",
        description: `El usuario ${username} fue eliminado correctamente.`,
        variant: "success",
      });
      onDelete(username);
      onOpenChange(false);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
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
            ¿Eliminar al usuario{" "}
            <span className="font-mono">{username}</span>?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es permanente y no se puede deshacer. Se eliminarán
            todos los datos del usuario del sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-red-500 -mt-1">{error}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Eliminando..." : "Sí, eliminar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteUserAlertDialog;
