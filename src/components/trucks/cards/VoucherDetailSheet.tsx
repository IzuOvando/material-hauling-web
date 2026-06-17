"use client";

import type { VoucherCamion } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { VoucherDetails } from "@/components/trucks/VoucherDetails";

interface VoucherDetailSheetProps {
  voucher: VoucherCamion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoucherDetailSheet({
  voucher,
  open,
  onOpenChange,
}: VoucherDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 gap-0"
      >
        <div className="px-6 pt-6 pb-4 border-b-2 border-primary-light/40">
          <SheetTitle className="text-2xl font-semibold text-primary">
            Detalle del voucher
          </SheetTitle>
          <SheetDescription className="text-sm text-primary/60 mt-1">
            Información completa del registro seleccionado.
          </SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {voucher && <VoucherDetails voucher={voucher} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
