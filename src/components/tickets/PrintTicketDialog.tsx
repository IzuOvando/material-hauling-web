import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePrinterStore } from "@/store";
import { Ticket } from "@prisma/client";

interface PrintDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  ticketsSelection: { [key: string]: boolean };
  tickets: Ticket[];
}

const PrintDialog = ({
  open,
  setOpen,
  ticketsSelection,
  tickets,
}: PrintDialogProps) => {
  const { printers } = usePrinterStore();

  const handleAction = () => {
    const selection = Object.keys(ticketsSelection);

    if (selection.length > 25) {
      alert("Trabajo en proceso, por el momento se imprimaran solo 20 tickets");
      setOpen(false);
    }

    const ticketsToPrint = tickets
      .filter((ticket) => selection.includes(ticket.uuid))
      .slice(0, 20);

    const availablePrinters = printers.filter(
      (printer) => printer.status === "online"
    );

    if (availablePrinters.length === 0) {
      alert("No hay impresoras disponibles");
      setOpen(false);
      return;
    }

    const firstPrinter = availablePrinters[0];

    firstPrinter.device?.printGroupOfTickets(ticketsToPrint);

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Imprimir tickets</DialogTitle>
          <DialogDescription>
            Se imprimirán {Object.keys(ticketsSelection).length} tickets
          </DialogDescription>
        </DialogHeader>
        {/* <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
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
        </span> */}
        <DialogFooter className="mt-[-1rem]">
          <Button onClick={handleAction}>Imprimir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintDialog;
