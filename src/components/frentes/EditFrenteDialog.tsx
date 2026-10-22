import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Frente } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import { Check, Loader2, Trash } from "lucide-react";
import DeleteFrenteAlertDialog from "./DeleteFrenteAlertDialog";
import FrenteLogoUpload from "./FrenteLogoUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFrenteDisplayName, updateFrenteTipoProyecto, updateFrenteEnableTiroCatalog } from "@/actions/frentes";
import { useToast } from "@/components/ui/use-toast";
import whiteLabelConfig from "#/white-label.config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { TipoProyecto } from "@prisma/client";

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
  const [currentTipoProyecto, setCurrentTipoProyecto] = useState<TipoProyecto>(frente.tipoProyecto);
  const [savingTipo, setSavingTipo] = useState(false);
  const [enableTiroCatalog, setEnableTiroCatalog] = useState(frente.enableTiroCatalog);
  const [savingTiroCatalog, setSavingTiroCatalog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const next = frente.displayName ?? siblingDisplayName ?? "";
    setDisplayName(next);
  }, [frente.displayName, siblingDisplayName]);

  useEffect(() => {
    setCurrentTipoProyecto(frente.tipoProyecto);
  }, [frente.tipoProyecto]);

  useEffect(() => {
    setEnableTiroCatalog(frente.enableTiroCatalog);
  }, [frente.enableTiroCatalog]);

  const handleSaveDisplayName = async () => {
    setSavingName(true);
    await updateFrenteDisplayName(frente.nombre, displayName);
    setSavingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
    onFrenteUpdated();
  };

  const handleTipoProyectoChange = async (value: TipoProyecto) => {
    const previous = currentTipoProyecto;
    setSavingTipo(true);
    setCurrentTipoProyecto(value);
    try {
      const result = await updateFrenteTipoProyecto(frente.nombre, value);
      if (!result.success) {
        setCurrentTipoProyecto(previous);
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el tipo de proyecto",
          variant: "destructive",
        });
        return;
      }
      if (value === "FIJO" && enableTiroCatalog) {
        setEnableTiroCatalog(false);
        await updateFrenteEnableTiroCatalog(frente.nombre, false);
      }
      onFrenteUpdated();
    } catch {
      setCurrentTipoProyecto(previous);
      toast({
        title: "Error",
        description: "No se pudo actualizar el tipo de proyecto",
        variant: "destructive",
      });
    } finally {
      setSavingTipo(false);
    }
  };

  const handleEnableTiroCatalogChange = async (checked: boolean) => {
    const previous = enableTiroCatalog;
    setSavingTiroCatalog(true);
    setEnableTiroCatalog(checked);
    try {
      const result = await updateFrenteEnableTiroCatalog(frente.nombre, checked);
      if (!result.success) {
        setEnableTiroCatalog(previous);
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar la configuración de tiro",
          variant: "destructive",
        });
        return;
      }
      onFrenteUpdated();
    } catch {
      setEnableTiroCatalog(previous);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración de tiro",
        variant: "destructive",
      });
    } finally {
      setSavingTiroCatalog(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px] flex flex-col max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>{(whiteLabelConfig as any)?.ui?.frentesManager?.editTitle || 'Editar Frente'}</DialogTitle>
            <DialogDescription>
              {(whiteLabelConfig as any)?.ui?.frentesManager?.editDescription || 'Edita el nombre del proyecto o el logo del '} <b>Frente {frente.nombre}</b>.
            </DialogDescription>
          </DialogHeader>

          <Separator className="shrink-0" />

          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
            {isOwner && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">{(whiteLabelConfig as any)?.ui?.frentesManager?.projectNameLabel || "Nombre del proyecto"}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={(whiteLabelConfig as any)?.ui?.frentesManager?.examplePlaceholder || 'Ej. Proyecto Carretero Norte'}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSaveDisplayName}
                      disabled={!isDirty || savingName}
                      className="shrink-0 bg-primary hover:bg-primary/90 text-white border-0"
                    >
                      {savingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : nameSaved ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        (whiteLabelConfig as any)?.ui?.frentesManager?.saveButton || 'Guardar'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Se muestra en el dashboard para todos los frentes del proyecto.
                  </p>
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    {(whiteLabelConfig as any)?.ui?.frentesManager?.tipoProyecto?.label || "Tipo de proyecto"}
                  </Label>
                  <Select
                    value={currentTipoProyecto}
                    onValueChange={handleTipoProyectoChange}
                    disabled={savingTipo}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIJO">
                        {(whiteLabelConfig as any)?.ui?.frentesManager?.tipoProyecto?.fijo || "Fijo"}
                      </SelectItem>
                      <SelectItem value="LINEAL">
                        {(whiteLabelConfig as any)?.ui?.frentesManager?.tipoProyecto?.lineal || "Lineal"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">
                    {currentTipoProyecto === "LINEAL"
                      ? ((whiteLabelConfig as any)?.ui?.frentesManager?.tipoProyecto?.linealHint || "Obra lineal — destino por cadenamiento")
                      : ((whiteLabelConfig as any)?.ui?.frentesManager?.tipoProyecto?.fijoHint || "Destino fijo — destino por tiro")}
                  </p>

                  {currentTipoProyecto === "LINEAL" && (
                    <div className="flex items-start gap-2 mt-2">
                      <Checkbox
                        id="enableTiroCatalog"
                        checked={enableTiroCatalog}
                        onCheckedChange={handleEnableTiroCatalogChange}
                        disabled={savingTiroCatalog}
                      />
                      <div className="flex flex-col gap-0.5">
                        <Label htmlFor="enableTiroCatalog" className="text-sm font-medium cursor-pointer">
                          {(whiteLabelConfig as any)?.ui?.frentesManager?.tipoProyecto?.enableTiroCatalogLabel || "Activar catálogo de tiro"}
                        </Label>
                        <p className="text-xs text-slate-400">
                          {(whiteLabelConfig as any)?.ui?.frentesManager?.tipoProyecto?.enableTiroCatalogHint || "Permite seleccionar tiro además de cadenamiento en proyectos lineales"}
                        </p>
                      </div>
                    </div>
                  )}
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
            <Button
              className="w-full flex items-center gap-2 bg-secondary hover:bg-red-600 text-white group"
              onClick={() => setShowDeleteAlert(true)}
            >
              <Trash color="white" size={18} /> {(whiteLabelConfig as any)?.ui?.frentesManager?.deleteButton || 'Eliminar Frente'}
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <DeleteFrenteAlertDialog
          frente={frente}
          onDelete={(name) => {
            setShowDeleteAlert(false);
            setOpen(false);
            onDeleteFrente(name);
          }}
        />
      </AlertDialog>
    </>
  );
};

export default EditFrenteDialog;
