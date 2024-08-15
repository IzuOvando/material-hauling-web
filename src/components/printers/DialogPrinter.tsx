import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { isValidIPAddress } from "@/utils/validators";
import { usePrinterStore } from "@/store";

interface DialogPrinterGeneralProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface DialogPrinterAddProps {
  mode: "add";
  newPrinterNumber: number;
}

interface DialogPrinterEditProps {
  mode: "edit" | "editip";
  name: string;
  ip: string;
}

type DialogPrinterProps = DialogPrinterGeneralProps &
  (DialogPrinterAddProps | DialogPrinterEditProps);

const DialogPrinter = (props: DialogPrinterProps) => {
  const title = props.mode === "add" ? "Agregar Impresora" : "Editar Impresora";
  const description =
    props.mode === "add"
      ? "Escribe un nombre para identificar la Impresora Termal y escribe la Dirección IP que se le fue asignada en tu red local (LAN)."
      : "Edita el nombre de la Impresora Termal y la Dirección IP que se le fue asignanda.";

  const { addPrinter, editPrinter, printers } = usePrinterStore();
  const [error, setError] = useState("");
  const refName = useRef<HTMLInputElement>(null);
  const refIP = useRef<HTMLInputElement>(null);

  const handleAction = () => {
    const name = refName.current?.value?.trim();
    const ip = refIP.current?.value.trim();

    // Validating fields

    if (!name || !ip) {
      setError("Llene todos los campos");
      return;
    }

    if (!isValidIPAddress(ip)) {
      setError("La dirección IP es inválida");
      return;
    }

    let printerExists = printers.some((printer) => printer.name === name);
    let isAdding = props.mode === "add";
    let isEditing = props.mode === "edit" && props.name !== name;

    if (printerExists && (isAdding || isEditing)) {
      setError("Ya existe una impresora con ese nombre");
      return;
    }

    printerExists = printers.some((printer) => printer.ip === ip);
    isEditing = props.mode === "edit" && props.ip !== ip;

    if (printerExists && (isAdding || isEditing)) {
      setError("Ya existe una impresora con esa dirección IP");
      return;
    }

    // Activating action

    if (props.mode === "add") addPrinter(name, ip);

    if (props.mode === "edit" || props.mode === "editip")
      editPrinter(props.name, name, ip);

    setError("");
    props.setOpen(false);
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAction();
  };

  return (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
      <DialogContent className="sm:max-w-[450px]" onKeyDown={handleEnter}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              disabled={props.mode === "editip"}
              ref={refName}
              defaultValue={
                props.mode === "add"
                  ? `Impresora ${props.newPrinterNumber}`
                  : props.name
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ip" className="text-right">
              Dirección IP
            </Label>
            <Input
              id="ip"
              ref={refIP}
              placeholder="192.168.0.1"
              className="col-span-3"
              defaultValue={props.mode === "edit" ? props.ip : undefined}
            />
          </div>
        </div>
        <span className="text-sm mt-[-1.25rem] text-red-500 font-medium">
          {error}
        </span>
        <DialogFooter className="mt-[-1rem]">
          <Button onClick={handleAction}>
            {props.mode === "add" ? "Agregar" : "Editar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogPrinter;
