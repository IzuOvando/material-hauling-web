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
  const { toast } = useToast();
  const router = useRouter();

  const handleAction = async () => {
    const name = refName.current?.value?.trim().toUpperCase();

    if (!name) {
      setError("Debes ingresar un nombre");
      return;
    }

    const alphanumericRegex = /^[A-Z0-9]+-F([0-9]+T?[0-9]*|G)$/;
    if (!alphanumericRegex.test(name)) {
      setError("Formato inválido.");
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
        body: JSON.stringify({ nombre: name }),
      });

      const data = await response.json();

      if (response.status === 409) {
        toast({
          title: "Error",
          description: data.error || `El frente ${name} ya existe.`,
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Error en la solicitud");
      }
      toast({
        title: "Éxito",
        description: `Frente ${name} creado con éxito.`,
        variant: "success",
      });
      router.refresh();
      setOpen(false);

    } catch (error) {
      console.error("Error al crear nuevo frente:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el nuevo frente.",
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
          <DialogTitle>Crear Frente</DialogTitle>
          <DialogDescription>
            Ingresa el nombre del frente (ej. ABCD-F1 o ABCD-FG). 
            Podrás editar los detalles después.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              ref={refName}
              placeholder="Ex. ABCD-F1"
              className="col-span-3 uppercase"
              maxLength={20}
              disabled={loading}
            />
          </div>
        </div>
        <span className="text-sm mt-[-1.25rem] text-red-500 font-medium">
          {error}
        </span>
        <DialogFooter className="mt-[-1rem]">
          <Button
            onClick={handleAction}
            disabled={loading}
            className="bg-secondary hover:bg-secondary-dark text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFrenteDialog;
