"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash, CircleCheck, MoreVertical } from "lucide-react";
import { Frente } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFrenteStore } from "@/store";
import { DeleteVouchersDialog, CloseCycleSheet } from "@/components/trucks";

interface TrucksDbHeaderProps {
  frente: string;
  frentes: Frente[];
  readOnly?: boolean;
  isOwner?: boolean;
  canActOnVouchers?: boolean;
}

export function TrucksDbHeader({
  frente,
  frentes,
  readOnly = false,
  isOwner = false,
  canActOnVouchers = false,
}: TrucksDbHeaderProps) {
  const router = useRouter();
  const { selectedFrente, setSelectedFrente } = useFrenteStore();
  const [openDelete, setOpenDelete] = useState(false);
  const [openCloseCycle, setOpenCloseCycle] = useState(false);

  const current = frentes.find((f) => f.nombre === frente);

  // Keep the global store in sync with the route so dependent dialogs
  // (delete, close cycle) act on the frente currently being viewed.
  useEffect(() => {
    if (current && selectedFrente?.nombre !== current.nombre) {
      setSelectedFrente(current);
    }
  }, [current, selectedFrente?.nombre, setSelectedFrente]);

  const project = current?.nombre.split(/-F\d/)[0] ?? frente;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => router.push("/trucks/db")}
          className="h-9 w-9 shrink-0 rounded-full border-2 border-accent/50 flex items-center justify-center text-accent hover:bg-accent hover:border-accent hover:text-white transition-all"
          aria-label="Volver a la selección de frentes"
          title="Cambiar de frente"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 leading-none">
            {project}
          </p>
          <h1 className="text-xl font-bold text-primary leading-tight truncate">
            {current?.displayName || current?.nombre || frente}
          </h1>
        </div>
      </div>

      {canActOnVouchers && !readOnly && (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-2 border-primary-light text-primary hover:bg-primary hover:!text-accent-light"
                title="Acciones"
                aria-label="Acciones del frente"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isOwner && (
                <DropdownMenuItem
                  onClick={() => setOpenCloseCycle(true)}
                  className="cursor-pointer gap-2"
                >
                  <CircleCheck className="h-4 w-4 text-primary" />
                  Cerrar ciclo
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setOpenDelete(true)}
                className="cursor-pointer gap-2 text-secondary focus:text-secondary"
              >
                <Trash className="h-4 w-4" />
                Eliminar registros
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isOwner && (
            <CloseCycleSheet
              open={openCloseCycle}
              setOpen={setOpenCloseCycle}
              onSuccess={() => router.refresh()}
            />
          )}
          {current && (
            <DeleteVouchersDialog
              open={openDelete}
              setOpen={setOpenDelete}
              frente={current}
            />
          )}
        </div>
      )}
    </div>
  );
}
