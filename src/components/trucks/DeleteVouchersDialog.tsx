"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [confirmText, setConfirmText] = useState("");

  // Reset the confirmation field whenever the dialog opens or closes.
  useEffect(() => {
    if (!open) setConfirmText("");
  }, [open]);

  const isConfirmed = confirmText.trim() === frente.nombre;

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Eliminar datos de Trucks</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-left text-sm">
          <p>
            Al realizar esta acción eliminarás{" "}
            <b>todos los registros de Trucks</b> en el frente{" "}
            <b>{frente.nombre}</b>. Esta acción no se puede deshacer.
          </p>
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-frente"
              className="block text-xs text-slate-500"
            >
              Escribe{" "}
              <span className="font-mono font-semibold text-secondary">
                {frente.nombre}
              </span>{" "}
              para confirmar.
            </label>
            <Input
              id="confirm-frente"
              autoComplete="off"
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={frente.nombre}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <DeleteVoucherButton frente={frente.nombre} disabled={!isConfirmed} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteVouchersDialog;
