import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trash } from "lucide-react";

const DeleteVouchersButton = ({ frente }: { frente: string }) => {
  const { toast } = useToast();

  const deleteVouchers = async () => {
    let disableToast: () => void;

    try {
      const response = await fetch("/api/trucks/deleteVoucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frenteNombre: frente }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar los registros.");
      }

      const { dismiss } = toast({
        title: "Eliminación Exitosa",
        description: `Se eliminaron los registros relacionados con el frente "${frente}".`,
        variant: "success",
      });
      disableToast = dismiss;
    } catch (error) {
      console.error("Error al eliminar los registros:", error);
      const { dismiss } = toast({
        title: "Eliminación Fallida",
        description: `No se pudieron eliminar los registros del frente "${frente}". Por favor, intente más tarde.`,
        variant: "destructive",
      });
      disableToast = dismiss;
    }

    setTimeout(() => {
      disableToast();
    }, 3000);
  };

  return (
    <Button
      className="py-2 px-4 bg-red-500 text-white hover:bg-red-600"
      onClick={deleteVouchers}
    >
      <Trash className="mr-2" />
      Eliminar Registros
    </Button>
  );
};

export default DeleteVouchersButton;
