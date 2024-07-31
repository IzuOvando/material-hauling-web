import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectGroup, SelectLabel } from "@radix-ui/react-select";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Frente } from "@prisma/client";
import { Trash } from "lucide-react";
import DeleteFrenteAlertDialog from "./DeleteFrenteAlertDialog";
import FileUpdate from "../upload/UpdateInput";
import FileUpload from "../upload/UploadInput";
import { TicketArea, TicketAreaList } from "@/types";

interface EditFrenteDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  frente: Frente;
  areTickets: {
    [key in TicketArea]: boolean;
  };
  onFrenteUpdated: () => void;
  onDeleteFrente: (name: string) => void;
}

const EditFrenteDialog = ({
  open,
  setOpen,
  frente,
  areTickets,
  onFrenteUpdated,
  onDeleteFrente,
}: EditFrenteDialogProps) => {
  const [area, setArea] = useState<TicketArea>(TicketArea.ACARREOS);

  return (
    <AlertDialog>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Editar Frente</DialogTitle>
            <DialogDescription>
              Aquí puedes subir una base de datos para el{" "}
              <b>Frente {frente.nombre}</b> en un área en específico o
              eliminarlo. <br />
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <span className="flex w-full gap-2">
              <Select
                onValueChange={(v: TicketArea) => setArea(v)}
                defaultValue={area}
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
              {areTickets[area] ? (
                <FileUpdate
                  selectedFrente={frente}
                  selectedArea={area}
                  onUpdate={onFrenteUpdated}
                />
              ) : (
                <FileUpload
                  selectedFrente={frente}
                  selectedArea={area}
                  onUpload={onFrenteUpdated}
                />
              )}
            </span>
            <span className="text-center text-sm mb-5">
              Si ya existe una base de datos en el área del frente, ésta{" "}
              <b>sera reeplazada</b> con la nueva base de datos.
            </span>
            <AlertDialogTrigger asChild>
              <Button
                className="flex items-center gap-2 hover:bg-red-500 group"
                onClick={() => {
                  setTimeout(() => {
                    setOpen(false);
                  }, 500);
                }}
              >
                <Trash color="white" size={18} /> Eliminar Frente
              </Button>
            </AlertDialogTrigger>
          </div>
        </DialogContent>
      </Dialog>
      <DeleteFrenteAlertDialog frente={frente} onDelete={onDeleteFrente} />
    </AlertDialog>
  );
};

export default EditFrenteDialog;
