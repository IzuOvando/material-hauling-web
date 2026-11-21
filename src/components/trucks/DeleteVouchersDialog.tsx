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
import DeleteVoucherButton from "./DeleteVoucherButton";
import { describeTrucksFilters } from "./filters/describeFilters";
import whiteLabelConfig from "#/white-label.config";

interface DeleteVouchersDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  frente: Frente;
  filters: string;
  total: number;
  onDeleted?: () => void;
}

function withBold(template: string, values: Record<string, string>) {
  return template.split(/(\{\w+\})/).map((part, i) => {
    const key = part.slice(1, -1);
    return part.startsWith("{") && key in values ? <b key={i}>{values[key]}</b> : part;
  });
}

const DeleteVouchersDialog = ({
  open,
  setOpen,
  frente,
  filters,
  total,
  onDeleted,
}: DeleteVouchersDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  const activeFilters = describeTrucksFilters(filters);
  const copy = whiteLabelConfig.ui.vouchers;

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
          {activeFilters.length > 0 ? (
            <>
              <p>
                {withBold(total === 1 ? copy.deleteDialogScopedOne : copy.deleteDialogScopedMany, {
                  count: total.toLocaleString("es-MX"),
                  frente: frente.nombre,
                })}
              </p>
              <ul className="list-disc space-y-0.5 pl-5 text-slate-600">
                {activeFilters.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p>{copy.deleteDialogScopedKeep}</p>
            </>
          ) : (
            <p>
              {copy.deleteDialogWarningPrefix} <b>{copy.deleteDialogWarningBold}</b>{" "}
              {copy.deleteDialogWarningMiddle} <b>{frente.nombre}</b>. {copy.deleteDialogWarningSuffix}
            </p>
          )}
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
          <DeleteVoucherButton
            frente={frente.nombre}
            filters={filters}
            expectedCount={total}
            disabled={!isConfirmed}
            onDeleted={() => {
              setOpen(false);
              onDeleted?.();
            }}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteVouchersDialog;
