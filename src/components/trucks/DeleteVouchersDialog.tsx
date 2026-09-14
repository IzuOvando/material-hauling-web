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
import whiteLabelConfig from "../../../white-label.config";

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
          <DialogTitle>{whiteLabelConfig.ui.vouchers.deleteDialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-left text-sm">
          <p>
            {whiteLabelConfig.ui.vouchers.deleteDialogWarningPrefix}{" "}
            <b>{whiteLabelConfig.ui.vouchers.deleteDialogWarningBold}</b>{" "}
            {whiteLabelConfig.ui.vouchers.deleteDialogWarningMiddle}{" "}
            <b>{frente.nombre}</b>. {whiteLabelConfig.ui.vouchers.deleteDialogWarningSuffix}
          </p>
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-frente"
              className="block text-xs text-slate-500"
            >
              {whiteLabelConfig.ui.vouchers.deleteDialogConfirmPrefix}{" "}
              <span className="font-mono font-semibold text-secondary">
                {frente.nombre}
              </span>{" "}
              {whiteLabelConfig.ui.vouchers.deleteDialogConfirmSuffix}
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
            {whiteLabelConfig.ui.vouchers.deleteDialogCancel}
          </Button>
          <DeleteVoucherButton frente={frente.nombre} disabled={!isConfirmed} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteVouchersDialog;
