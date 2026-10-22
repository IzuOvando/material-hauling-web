"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trash, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import whiteLabelConfig from "#/white-label.config";

const DeleteVouchersButton = ({
  frente,
  disabled = false,
}: {
  frente: string;
  disabled?: boolean;
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteVouchers = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

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
        title: whiteLabelConfig.ui.vouchers.deleteSuccessTitle,
        description: whiteLabelConfig.ui.vouchers.deleteSuccessDescription.replace("{frente}", frente),
        variant: "success",
      });
      setTimeout(() => {
        dismiss();
        router.push("/db");
      }, 1000);
    } catch (error) {
      console.error("Error al eliminar los registros:", error);
      toast({
        title: whiteLabelConfig.ui.vouchers.deleteErrorTitle,
        description: whiteLabelConfig.ui.vouchers.deleteErrorDescription.replace("{frente}", frente),
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  return (
    <Button
      className="py-2 px-4 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500"
      onClick={deleteVouchers}
      disabled={disabled || isDeleting}
    >
      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2" />}
      {whiteLabelConfig.ui.vouchers.deleteButton}
    </Button>
  );
};

export default DeleteVouchersButton;
