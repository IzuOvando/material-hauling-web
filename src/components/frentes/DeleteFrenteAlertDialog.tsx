import { useState } from "react";
import {
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Frente } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useToast } from "../ui/use-toast";
import whiteLabelConfig from "#/white-label.config";

interface DeleteFrenteAlertDialogProps {
  frente: Frente;
  onDelete: (name: string) => void;
}

const DeleteFrenteAlertDialog = ({
  frente,
  onDelete,
}: DeleteFrenteAlertDialogProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const response = await fetch("/api/files/deletefrente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre: frente.nombre }),
      });

      if (!response.ok) {
        throw new Error("Error en la solicitud");
      }

      toast({
        title: whiteLabelConfig.ui.frentesManager.deleteDialog.successTitle,
        description: whiteLabelConfig.ui.frentesManager.deleteDialog.successDescription,
        variant: "success",
      });
      onDelete(frente.nombre);
    } catch (error) {
      console.error("Error al eliminar el frente:", error);
      toast({
        title: "Error",
        description: whiteLabelConfig.ui.frentesManager.deleteDialog.errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {whiteLabelConfig.ui.frentesManager.deleteDialog.title.replace("{name}", frente.nombre)}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {whiteLabelConfig.ui.frentesManager.deleteDialog.description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isDeleting}>{whiteLabelConfig.ui.frentesManager.deleteDialog.cancel}</AlertDialogCancel>
        <AlertDialogAction className="hover:bg-red-500" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {whiteLabelConfig.ui.frentesManager.deleteDialog.confirm}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default DeleteFrenteAlertDialog;
