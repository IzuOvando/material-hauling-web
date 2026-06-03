import { useEffect, useRef, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Check, Loader2, Trash } from "lucide-react";
import DeleteFrenteAlertDialog from "./DeleteFrenteAlertDialog";
import FileUpdate from "../upload/UpdateInput";
import FileUpload from "../upload/UploadInput";
import FrenteLogoUpload from "./FrenteLogoUpload";
import { TicketArea, TicketAreaList } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFrenteDisplayName } from "@/actions/frentes";

interface EditFrenteDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  frente: Frente;
  areTickets: {
    [key in TicketArea]: boolean;
  };
  onFrenteUpdated: () => void;
  onLogoUpdated: () => void;
  onDeleteFrente: (name: string) => void;
  isOwner?: boolean;
  siblingDisplayName?: string | null;
}

const EditFrenteDialog = ({
  open,
  setOpen,
  frente,
  areTickets,
  onFrenteUpdated,
  onLogoUpdated,
  onDeleteFrente,
  isOwner = false,
  siblingDisplayName,
}: EditFrenteDialogProps) => {
  const [area, setArea] = useState<TicketArea>(TicketArea.ACARREOS);
  const initialDisplayName = frente.displayName ?? siblingDisplayName ?? "";
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const isDirty = displayName !== initialDisplayName;

  useEffect(() => {
    const next = frente.displayName ?? siblingDisplayName ?? "";
    setDisplayName(next);
  }, [frente.displayName, siblingDisplayName]);

  const handleSaveDisplayName = async () => {
    setSavingName(true);
    await updateFrenteDisplayName(frente.nombre, displayName);
    setSavingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
    onFrenteUpdated();
  };

  return (
    <AlertDialog>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px] flex flex-col max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>Editar Frente</DialogTitle>
            <DialogDescription>
              Aquí puedes subir una base de datos para el{" "}
              <b>Frente {frente.nombre}</b> en un área en específico o
              eliminarlo.
            </DialogDescription>
          </DialogHeader>

          <Separator className="shrink-0" />

          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
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

            <span className="text-center text-sm text-slate-500">
              Si ya existe una base de datos en el área del frente, ésta{" "}
              <b>sera reemplazada</b> con la nueva base de datos.
            </span>

            {isOwner && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Nombre del proyecto</Label>
                  <div className="flex gap-2">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ej. Tren de Pasajeros CDMX-Puebla"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSaveDisplayName}
                      disabled={!isDirty || savingName}
                      className="shrink-0"
                      variant="outline"
                    >
                      {savingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : nameSaved ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        "Guardar"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Se muestra en el dashboard para todos los frentes del proyecto.
                  </p>
                </div>

                <Separator />

                <FrenteLogoUpload
                  frente={frente}
                  onLogoUpdated={onLogoUpdated}
                />
              </>
            )}
          </div>

          <Separator className="shrink-0" />
          <div className="px-6 py-4 shrink-0">
            <AlertDialogTrigger asChild>
              <Button
                className="w-full flex items-center gap-2 hover:bg-red-500 group"
                onClick={() => setTimeout(() => setOpen(false), 500)}
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
