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

const FrenteTools = ({ frentes }: { frentes: Frente[] }) => {
  // Hooks
  const {
    selectedFrente,
    selectedArea,
    setSelectedFrente,
    setSelectedArea,
    reset: resetFrente,
  } = useFrenteStore();
  const { resetSelection } = useTicketsSelectionStore();
  const router = useRouter();
  // States
  const [showAddFrenteDialog, setShowAddFrenteDialog] = useState(false);
  const [showEditFrenteDialog, setShowEditFrenteDialog] = useState(false);
  const [areTickets, setAreTickets] = useState<{
    [key in TicketArea]: boolean;
  }>({
    [TicketArea.ACARREOS]: false,
    [TicketArea.GASOLINA]: false,
  });
  const [frentesDisplay, setFrentesDisplay] = useState<Frente[]>(frentes);

  const handleSelectFrente = (value: string) => {
    const frente = frentesDisplay.find((f) => f.nombre === value);
    if (frente) {
      setSelectedFrente(frente);
    }
  };

  const handleSelectArea = (value: TicketArea) => {
    setSelectedArea(value);
  };

  const fetchAreTickets = async (frente: string) => {
    fetch("/api/frente/areTickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre: frente }),
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setAreTickets(data);
      })
      .catch((err) => {
        console.error(
          "Error al verificar si hay tickets asociados al frente:",
          err
        );
      });
  };

  const handleOnFrenteUpdated = () => {
    setShowEditFrenteDialog(false);
    resetSelection();
    if (selectedFrente) fetchAreTickets(selectedFrente.nombre);
    router.refresh();
  };

  const handleOnAddFrente = (frente: string) => {
    setFrentesDisplay([
      ...frentesDisplay,
      { nombre: frente, excelUrlGasolinaBlob: null, excelUrlAcarreosBlob: null }
    ]);
    setSelectedFrente({
      nombre: frente,
      excelUrlGasolinaBlob: null,
      excelUrlAcarreosBlob: null
    });
    setSelectedArea(TicketArea.ACARREOS);
  };

  const handleOnDeleteFrente = (name: string) => {
    resetSelection();
    resetFrente();
    setAreTickets({
      [TicketArea.ACARREOS]: false,
      [TicketArea.GASOLINA]: false,
    });
    setFrentesDisplay([...frentesDisplay.filter((f) => f.nombre !== name)]);
    router.push("/");
  };

  useEffect(() => {
    if (selectedFrente && selectedArea) {
      resetSelection();
      router.push(`/tickets/${selectedFrente.nombre}/${selectedArea}`);
    }
  }, [selectedFrente, selectedArea, router, resetSelection]);

  useEffect(() => {
    if (selectedFrente) fetchAreTickets(selectedFrente.nombre);
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
      {selectedFrente && (
        <>
          <Select
            onValueChange={handleSelectArea}
            defaultValue={selectedArea ? selectedArea : undefined}
          >
            <SelectTrigger className="w-[130px] border-2 border-accent text-accent font-bold text-lg">
              <SelectValue placeholder="Área..." className="mx-0" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="ml-3 font-bold">Área</SelectLabel>
                {TicketAreaList.map((area) => (
                  <SelectItem
                    key={area.label}
                    value={area.value}
                    className="cursor-pointer"
                  >
                    {area.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
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
          {selectedArea && (
            <DownloadFrenteButton
              frente={selectedFrente.nombre}
              area={selectedArea}
              areTickets={areTickets}
            />
          )}
        </>
      )}
      <Button
        className="p-2 bg-transparent hover:bg-[rgba(var(--accent-light-color)/50%)] group ml-[-0.5rem]"
        onClick={() => setShowAddFrenteDialog(true)}
      >
        <CirclePlus className="text-accent" />
      </Button>
      <AddFrenteDialog
        open={showAddFrenteDialog}
        setOpen={setShowAddFrenteDialog}
        onAddFrente={handleOnAddFrente}
      />
    </div>
  );
};

export default FrenteTools;
