"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CreateUserForm } from "@/components/users/CreateUserForm";
import whiteLabelConfig from "#/white-label.config";

interface NewUserSheetProps {
  frentes: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewUserSheet({
  frentes,
  open,
  onOpenChange,
  onSuccess,
}: NewUserSheetProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next) onSuccess();
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl p-0 overflow-hidden flex flex-col border-0 [&>button]:text-white/80 [&>button>svg]:size-6 [&>button:hover]:text-white"
      >
        <div className="bg-primary px-6 py-5 pr-14 shrink-0">
          <SheetTitle className="text-accent text-xl font-semibold">
            {(whiteLabelConfig as any)?.ui?.users?.create?.title || 'Registrar nuevo usuario'}
          </SheetTitle>
          <SheetDescription className="text-white/70 text-sm mt-1">
            {(whiteLabelConfig as any)?.ui?.users?.create?.subtitle || 'Completa los tres pasos para crear un nuevo usuario en el sistema.'}
          </SheetDescription>
        </div>
        <div className="flex-1 overflow-y-auto">
          <CreateUserForm frentes={frentes} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
