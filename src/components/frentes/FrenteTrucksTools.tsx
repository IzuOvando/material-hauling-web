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
import { useFrenteStore, useTicketsSelectionStore } from "@/store";
import { SelectGroup, SelectLabel } from "@radix-ui/react-select";
import { Frente } from "@prisma/client";
import { useEffect } from "react";
import { Button } from "../ui/button";
import { CirclePlus, Pencil } from "lucide-react";
import AddFrenteDialog from "./AddFrenteDialog";
import EditFrenteDialog from "./EditFrenteDialog";
import { TicketArea, TicketAreaList } from "@/types";
import DownloadFrenteButton from "./DownloadFrenteButton";

const FrenteTrucksTools = ({
  frentes,
  canDownload,
}: {
  frentes: Frente[];
  canDownload: boolean;
}) => {
  // Hooks
  const {
    selectedFrente,
    setSelectedFrente,
    refreshFacets,
    reset: resetFrente,
  } = useFrenteStore();
  const router = useRouter();
  // States
  const [showAddFrenteDialog, setShowAddFrenteDialog] = useState(false);
  const [showEditFrenteDialog, setShowEditFrenteDialog] = useState(false);
  const [areTickets, setAreTickets] = useState<{
    [key in TicketArea]: boolean;
  }>({
    [TicketArea.ACARREOS]: false,
    [TicketArea.GASOLINA]: false,
    [TicketArea.CONCRETO]: false,
  });
  const [frentesDisplay, setFrentesDisplay] = useState<Frente[]>(frentes);

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
        <SelectTrigger className="w-[120px] border-2 border-accent text-accent font-bold text-lg">
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
      {/* {canDownload && (
        <DownloadFrenteButton
          frente={selectedFrente.nombre}
          //   area={selectedArea}
          areTickets={areTickets}
        />
        TODO: Add Trucks Download Button
      )} */}
    </div>
  );
};

export default FrenteTrucksTools;
