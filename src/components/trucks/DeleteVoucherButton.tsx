"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trash, Loader2 } from "lucide-react";
import whiteLabelConfig from "#/white-label.config";

const DeleteVouchersButton = ({
  frente,
  filters,
  expectedCount,
  disabled = false,
  onDeleted,
}: {
  frente: string;
  filters: string;
  expectedCount: number;
  disabled?: boolean;
  onDeleted?: () => void;
}) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteVouchers = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const response = await fetch("/api/trucks/deleteVoucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frenteNombre: frente, filters, expectedCount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar los registros.");
      }

      const { dismiss } = toast({
        title: whiteLabelConfig.ui.vouchers.deleteSuccessTitle,
        description: whiteLabelConfig.ui.vouchers.deleteSuccessDescription
          .replace("{frente}", frente)
          .replace("{count}", String(data.deleted)),
        variant: "success",
      });
      setTimeout(dismiss, 3000);
      onDeleted?.();
      setIsDeleting(false);
    } catch (error) {
      console.error("Error al eliminar los registros:", error);
      toast({
        title: whiteLabelConfig.ui.vouchers.deleteErrorTitle,
        description:
          error instanceof Error && error.message
            ? error.message
            : whiteLabelConfig.ui.vouchers.deleteErrorDescription.replace("{frente}", frente),
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
