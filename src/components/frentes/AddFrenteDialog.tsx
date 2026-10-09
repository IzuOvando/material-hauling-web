import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import whiteLabelConfig from "#/white-label.config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddFrenteDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AddFrenteDialog = ({
  open,
  setOpen,
}: AddFrenteDialogProps) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const refName = useRef<HTMLInputElement>(null);
  const [tipoProyecto, setTipoProyecto] = useState<"LINEAL" | "FIJO">("FIJO");
  const { toast } = useToast();
  const router = useRouter();

  const handleAction = async () => {
    const name = refName.current?.value?.trim().toUpperCase();

    if (!name) {
      setError(whiteLabelConfig.ui.frentesManager.addDialog.requiredName);
      return;
    }

    const alphanumericRegex = /^[A-Z0-9]+-[A-Z0-9]+$/;
    if (!alphanumericRegex.test(name)) {
      setError(whiteLabelConfig.ui.frentesManager.addDialog.invalidFormat);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/files/addfrente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre: name, tipoProyecto }),
      });

      const data = await response.json();

      if (response.status === 409) {
        toast({
          title: "Error",
          description: data.error || whiteLabelConfig.ui.frentesManager.addDialog.duplicateDescription.replace("{name}", name),
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Error en la solicitud");
      }
      toast({
        title: whiteLabelConfig.ui.frentesManager.addDialog.successTitle,
        description: whiteLabelConfig.ui.frentesManager.addDialog.successDescription.replace("{name}", name),
        variant: "success",
      });
      router.refresh();
      setOpen(false);

    } catch (error) {
      console.error("Error al crear nuevo frente:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : whiteLabelConfig.ui.frentesManager.addDialog.duplicateDescription,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAction();
  };

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : setOpen}>
      <DialogContent className="sm:max-w-[450px]" onKeyDown={handleEnter}>
        <DialogHeader>
          <DialogTitle>{whiteLabelConfig.ui.frentesManager.addDialog.title}</DialogTitle>
          <DialogDescription>
            {whiteLabelConfig.ui.frentesManager.addDialog.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {whiteLabelConfig.ui.frentesManager.addDialog.nameLabel}
            </Label>
            <Input
              ref={refName}
              placeholder={whiteLabelConfig.ui.frentesManager.addDialog.namePlaceholder}
              className="col-span-3 uppercase"
              maxLength={20}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tipoProyecto" className="text-right">
              {(whiteLabelConfig as any)?.ui?.frentesManager?.tipoProyecto?.label || "Tipo"}
            </Label>
            <div className="col-span-3">
              <Select value={tipoProyecto} onValueChange={(v) => setTipoProyecto(v as "LINEAL" | "FIJO")}>
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
              <p className="text-xs text-slate-400 mt-1">
                {tipoProyecto === "LINEAL"
                  ? ((whiteLabelConfig as any)?.ui?.frentesManager?.tipoProyecto?.linealHint || "Obra lineal — destino por cadenamiento")
                  : ((whiteLabelConfig as any)?.ui?.frentesManager?.tipoProyecto?.fijoHint || "Destino fijo — destino por tiro")}
              </p>
            </div>
          </div>
        </div>
        <span className="text-sm mt-[-1.25rem] text-red-500 font-medium">
          {error}
        </span>
        <DialogFooter className="mt-[-1rem]">
          <Button
            onClick={handleAction}
            disabled={loading}
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? whiteLabelConfig.ui.frentesManager.addDialog.creating : whiteLabelConfig.ui.frentesManager.addDialog.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFrenteDialog;
