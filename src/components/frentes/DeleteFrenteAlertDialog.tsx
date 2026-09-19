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
import { useToast } from "../ui/use-toast";
import whiteLabelConfig from "../../../white-label.config";

interface DeleteFrenteAlertDialogProps {
  frente: Frente;
  onDelete: (name: string) => void;
}

const DeleteFrenteAlertDialog = ({
  frente,
  onDelete,
}: DeleteFrenteAlertDialogProps) => {
  const { toast } = useToast();

  const handleDelete = async () => {
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
        <AlertDialogCancel>{whiteLabelConfig.ui.frentesManager.deleteDialog.cancel}</AlertDialogCancel>
        <AlertDialogAction className="hover:bg-red-500" onClick={handleDelete}>
          {whiteLabelConfig.ui.frentesManager.deleteDialog.confirm}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default DeleteFrenteAlertDialog;
