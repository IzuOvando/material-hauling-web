import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Frente } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import { Check, Loader2, Trash } from "lucide-react";
import DeleteFrenteAlertDialog from "./DeleteFrenteAlertDialog";
import FrenteLogoUpload from "./FrenteLogoUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFrenteDisplayName } from "@/actions/frentes";

interface EditFrenteDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  frente: Frente;
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
  onFrenteUpdated,
  onLogoUpdated,
  onDeleteFrente,
  isOwner = false,
  siblingDisplayName,
}: EditFrenteDialogProps) => {
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
              Edita el nombre del proyecto o el logo del{" "}
              <b>Frente {frente.nombre}</b>.
            </DialogDescription>
          </DialogHeader>

          <Separator className="shrink-0" />

          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
            {isOwner && (
              <>
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
                      className="shrink-0 bg-primary hover:bg-primary-dark text-white border-0"
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
                className="w-full flex items-center gap-2 bg-secondary hover:bg-red-600 text-white group"
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
