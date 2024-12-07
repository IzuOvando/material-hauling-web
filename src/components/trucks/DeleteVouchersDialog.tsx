"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Frente } from "@prisma/client";
import { DeleteVoucherButton } from ".";

interface DeleteVouchersDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  frente: Frente;
}

const DeleteVouchersDialog = ({
  open,
  setOpen,
  frente,
}: DeleteVouchersDialogProps) => {
  const handleAction = async () => {
    setOpen(false);
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAction();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]" onKeyDown={handleEnter}>
        <DialogHeader>
          <DialogTitle>Eliminar Datos de Trucks</DialogTitle>
        </DialogHeader>
        <span className="text-left text-sm mb-5">
          Al realizar esta acción eliminaras todos los registros de Trucks en el
          frente <b>{frente.nombre}</b>.
        </span>
        <DialogFooter className="mt-[-1rem]">
          <Button variant="outline" onClick={handleAction}>
            Cancelar
          </Button>
          <DeleteVoucherButton frente={frente.nombre} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteVouchersDialog;
