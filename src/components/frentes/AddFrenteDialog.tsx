import { useRef, useState } from "react";
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

interface AddFrenteDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AddFrenteDialog = ({ open, setOpen }: AddFrenteDialogProps) => {
  const [error, setError] = useState("");
  const refName = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAction = async () => {
    const name = refName.current?.value?.trim().toUpperCase();

    if (!name) {
      setError("Debes ingresar un nombre");
      return;
    }

    const alphanumericRegex = /^[a-zA-Z0-9]{4}$/;
    if (!alphanumericRegex.test(name)) {
      setError("Nombre invalido");
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/files/addfrente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre: name }),
      });

      if (!response.ok) {
        throw new Error("Error en la solicitud");
      }

      toast({
        title: "Éxito",
        description: `Frente ${name} creado con éxito.`,
        variant: "success",
      });
      setTimeout(() => window.location.reload(), 2500);
    } catch (error) {
      console.error("Error al crear nuevo frente:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el nuevo frente.",
        variant: "destructive",
      });
    } finally {
      setOpen(false);
    }
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAction();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]" onKeyDown={handleEnter}>
        <DialogHeader>
          <DialogTitle>Crear Frente</DialogTitle>
          <DialogDescription>
            Ingresa un nombre de 4 carácteres alfanuméricos para identificar el
            Frente. Posteriormente podrás editarlo para llenar su base de datos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              ref={refName}
              placeholder="Ex. DP05"
              className="col-span-3 uppercase"
              maxLength={4}
            />
          </div>
        </div>
        <span className="text-sm mt-[-1.25rem] text-red-500 font-medium">
          {error}
        </span>
        <DialogFooter className="mt-[-1rem]">
          <Button onClick={handleAction}>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFrenteDialog;
