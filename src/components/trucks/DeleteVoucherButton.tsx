"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";

const DeleteVouchersButton = ({
  frente,
  disabled = false,
}: {
  frente: string;
  disabled?: boolean;
}) => {
  const { toast } = useToast();
  const router = useRouter();

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
      setTimeout(() => {
        router.push("/db");
      }, 2000);
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
      className="py-2 px-4 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500"
      onClick={deleteVouchers}
      disabled={disabled}
    >
      <Trash className="mr-2" />
      Eliminar Registros
    </Button>
  );
};

export default DeleteVouchersButton;
