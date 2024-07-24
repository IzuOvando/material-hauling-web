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
import { useFrenteStore } from "@/store";
import { useRouter } from "next/navigation";

interface DeleteFrenteAlertDialogProps {
  frente: Frente;
}

const DeleteFrenteAlertDialog = ({ frente }: DeleteFrenteAlertDialogProps) => {
  const { toast } = useToast();
  const { reset } = useFrenteStore()
  const router = useRouter();

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
        title: "Éxito",
        description: `Frente eliminado con éxito.`,
        variant: "success",
      });
      reset();
      setTimeout(() => router.push('/'), 2500);
    } catch (error) {
      console.error("Error al eliminar el frente:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el frente.",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          ¿Estás seguro de eliminar {frente.nombre}?
        </AlertDialogTitle>
        <AlertDialogDescription>
          Borraras todos los Tickets que estén relacionados con este Frente.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction className="hover:bg-red-500" onClick={handleDelete}>
          Sí, Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default DeleteFrenteAlertDialog;
