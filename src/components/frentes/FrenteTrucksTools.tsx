"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFrenteStore } from "@/store";
import { SelectGroup, SelectLabel } from "@radix-ui/react-select";
import { Frente } from "@prisma/client";
import { useEffect } from "react";
import {
  DeleteVouchersDialog,
  DownloadVoucherCamionButton,
} from "@/components/trucks";
import { Section } from "@/types";
import { Button } from "../ui/button";
import { Trash } from "lucide-react";

const FrenteTrucksTools = ({
  frentes,
  areTickets,
  readOnly = false,
}: {
  frentes: Frente[];
  areTickets?: boolean;
  readOnly?: boolean;
}) => {
  // Hooks
  const { selectedFrente, setSelectedFrente } = useFrenteStore();
  const router = useRouter();
  // States
  const [frentesDisplay, setFrentesDisplay] = useState<Frente[]>(frentes);
  const [openDelete, setOpenDelete] = useState(false);

  const handleSelectFrente = (value: string) => {
    const frente = frentesDisplay.find((f) => f.nombre === value);
    if (frente) {
      setSelectedFrente(frente);
    }
  };

  useEffect(() => {
    if (selectedFrente) {
      router.push(`/trucks/db/${selectedFrente.nombre}`);
    }
  }, [selectedFrente]);

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <Select
        onValueChange={handleSelectFrente}
        value={selectedFrente ? selectedFrente?.nombre : undefined}
      >
        <SelectTrigger className="w-[180px] border-2 border-accent text-accent font-bold text-lg">
          <SelectValue placeholder="Frente..." className="mx-0" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="ml-3 font-bold">Frentes</SelectLabel>
            {frentesDisplay.map((frente) => (
              <SelectItem
                key={frente.nombre}
                value={frente.nombre}
                className="cursor-pointer"
              >
                {frente.nombre}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {selectedFrente && areTickets && !readOnly && (
        <>
          <DownloadVoucherCamionButton
            frente={selectedFrente.nombre}
            section={Section.VOUCHERCAMION}
          />
          <Button
            className="p-2 bg-transparent hover:bg-[rgba(var(--accent-light-color)/50%)] group ml-[-0.5rem]"
            onClick={() => setOpenDelete(true)}
          >
            <Trash className="text-accent" />
          </Button>
          <DeleteVouchersDialog
            open={openDelete}
            setOpen={setOpenDelete}
            frente={selectedFrente}
          />
        </>
      )}
    </div>
  );
};

export default FrenteTrucksTools;
