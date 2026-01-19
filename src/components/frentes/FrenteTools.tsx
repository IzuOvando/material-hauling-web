"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { SelectGroup, SelectLabel } from "@radix-ui/react-select";
import { Button } from "../ui/button";
import { CirclePlus, Pencil } from "lucide-react";

import { Frente } from "@prisma/client";
import { TicketArea, TicketAreaList } from "@/types";
import { useFrenteStore, useTicketsSelectionStore } from "@/store";

import AddFrenteDialog from "./AddFrenteDialog";
import EditFrenteDialog from "./EditFrenteDialog";
import DownloadFrenteButton from "./DownloadFrenteButton";

type Props = {
  frentes: Frente[];
  role: "owner" | "admin" | "user";
};

const FrenteTools = ({ frentes, role }: Props) => {
  const {
    selectedFrente,
    selectedArea,
    setSelectedFrente,
    setSelectedArea,
    refreshFacets,
    reset: resetFrente,
  } = useFrenteStore();

  const { resetSelection } = useTicketsSelectionStore();
  const router = useRouter();

  const [showAddFrenteDialog, setShowAddFrenteDialog] = useState(false);
  const [showEditFrenteDialog, setShowEditFrenteDialog] = useState(false);

  const [areTickets, setAreTickets] = useState<Record<TicketArea, boolean>>({
    [TicketArea.ACARREOS]: false,
    [TicketArea.GASOLINA]: false,
    [TicketArea.CONCRETO]: false,
    [TicketArea.ASFALTO]: false,
  });

  const handleSelectFrente = (value: string) => {
    const frente = frentes.find((f) => f.nombre === value);
    if (frente) {
      setSelectedFrente(frente);
    }
  };

  const handleSelectArea = (value: TicketArea) => {
    setSelectedArea(value);
  };

  const fetchAreTickets = async (frente: string) => {
    try {
      const res = await fetch("/api/frente/areTickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: frente }),
      });

      const data = await res.json();
      setAreTickets(data);
    } catch (err) {
      console.error("Error al verificar tickets:", err);
    }
  };

  const handleOnFrenteUpdated = () => {
    setShowEditFrenteDialog(false);
    resetSelection();
    if (selectedFrente) fetchAreTickets(selectedFrente.nombre);
    refreshFacets();
    router.refresh();
  };

  const handleOnDeleteFrente = (name: string) => {
    resetSelection();
    resetFrente();

    setAreTickets({
      [TicketArea.ACARREOS]: false,
      [TicketArea.GASOLINA]: false,
      [TicketArea.CONCRETO]: false,
      [TicketArea.ASFALTO]: false,
    });

    router.push("/");
  };

  useEffect(() => {
    if (selectedFrente && selectedArea) {
      resetSelection();
      router.push(`/tickets/${selectedFrente.nombre}/${selectedArea}`);
    }
  }, [selectedFrente, selectedArea, router, resetSelection]);

  useEffect(() => {
    if (selectedFrente) {
      fetchAreTickets(selectedFrente.nombre);
    }
  }, [selectedFrente]);

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <Select
        onValueChange={handleSelectFrente}
        value={selectedFrente?.nombre}
      >
        <SelectTrigger className="w-[120px] border-2 border-accent text-accent font-bold text-lg">
          <SelectValue placeholder="Frente..." />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            <SelectLabel className="ml-3 font-bold">Frentes</SelectLabel>
            {frentes.map((frente) => (
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

      {selectedFrente && (
        <>
          <Select
            onValueChange={(value) => handleSelectArea(value as TicketArea)}
            value={selectedArea ?? undefined}
          >
            <SelectTrigger className="w-[130px] border-2 border-accent text-accent font-bold text-lg">
              <SelectValue placeholder="Área..." />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel className="ml-3 font-bold">Área</SelectLabel>
                {TicketAreaList.map((area) => (
                  <SelectItem
                    key={area.label}
                    value={area.value}
                  >
                    {area.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {role === "owner" && (
            <>
              <Button
                className="py-2 px-[0.4rem] border-2 border-accent bg-white hover:bg-accent group"
                onClick={() => setShowEditFrenteDialog(true)}
              >
                <Pencil className="text-accent group-hover:text-white" />
              </Button>

              <EditFrenteDialog
                open={showEditFrenteDialog}
                setOpen={setShowEditFrenteDialog}
                frente={selectedFrente}
                areTickets={areTickets}
                onFrenteUpdated={handleOnFrenteUpdated}
                onDeleteFrente={handleOnDeleteFrente}
              />
            </>
          )}

          {selectedArea && (
            <DownloadFrenteButton
              frente={selectedFrente.nombre}
              area={selectedArea}
              areTickets={areTickets}
            />
          )}
        </>
      )}

      {role === "owner" && (
        <>
          <Button
            className="p-2 bg-transparent hover:bg-[rgba(var(--accent-light-color)/50%)]"
            onClick={() => setShowAddFrenteDialog(true)}
          >
            <CirclePlus className="text-accent" />
          </Button>

          <AddFrenteDialog
            open={showAddFrenteDialog}
            setOpen={setShowAddFrenteDialog}
          />
        </>
      )}
    </div>
  );
};

export default FrenteTools;
