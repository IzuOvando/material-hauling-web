"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFrenteStore from "@/store/useFrenteStore";
import { SelectGroup, SelectLabel } from "@radix-ui/react-select";
import { Frente } from "@prisma/client";
import { useEffect } from "react";
import { Button } from "../ui/button";
import { CirclePlus, Pencil } from "lucide-react";
import AddFrenteDialog from "./AddFrenteDialog";
import EditFrenteDialog from "./EditFrenteDialog";

const FrenteTools = ({ frentes }: { frentes: Frente[] }) => {
  const { selectedFrente, setSelectedFrente } = useFrenteStore();
  const [showAddFrenteDialog, setShowAddFrenteDialog] = useState(false);
  const [showEditFrenteDialog, setShowEditFrenteDialog] = useState(false);

  const handleSelectChange = (value: string) => {
    const frente = frentes.find((f) => f.nombre === value);
    if (frente) {
      setSelectedFrente(frente);
    }
  };

  useEffect(() => {
    if (frentes.length > 0 && !selectedFrente) {
      setSelectedFrente(frentes[0]);
    }
  }, [frentes, selectedFrente, setSelectedFrente]);

  return (
    <div className="flex items-center gap-2">
      <Select
        onValueChange={handleSelectChange}
        defaultValue={frentes.length > 0 ? frentes[0].nombre : undefined}
      >
        <SelectTrigger className="w-[120px] border-2 border-accent text-accent font-bold text-lg">
          <SelectValue placeholder="Frente..." className="mx-0" />
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
          />
        </>
      )}
      <Button
        className="p-2 bg-transparent hover:bg-[rgba(var(--accent-light-color)/50%)] group ml-[-2.5px]"
        onClick={() => setShowAddFrenteDialog(true)}
      >
        <CirclePlus className="text-accent" />
      </Button>
      <AddFrenteDialog
        open={showAddFrenteDialog}
        setOpen={setShowAddFrenteDialog}
      />
    </div>
  );
};

export default FrenteTools;
