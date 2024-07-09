import { useState } from "react";
import {
  Printer as PrinterIcon,
  Pencil,
  Trash2,
  ArrowUpDown,
  ReceiptText,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import DialogPrinter from "./DialogPrinter";
import AlertDialogDeletePrinter from "./AlertDialogDeletePrinter";
import { Printer } from "@/types";

const PrinterAsideCard = (printer: Printer) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <AlertDialog>
      <ContextMenu>
        <ContextMenuTrigger>
          <div className=" flex items-center flex-col rounded-md border p-4 w-full select-none">
            <PrinterIcon
              size={90}
              strokeWidth={6}
              absoluteStrokeWidth
              color="rgb(var(--accent-dark-color))"
            />
            <div className="w-full flex flex-col items-center">
              <span className="font-bold text-xl text-center">
                {printer.name}
              </span>
              <span className="font-medium text-lg text-gray-600">
                {printer.ip}
              </span>
              {printer.status === "connecting" ? (
                <span className="flex gap-2 justify-center items-center text-sky-500 font-medium">
                  <span className="flex h-2 w-2 rounded-full bg-sky-500" />
                  Connecting...
                </span>
              ) : printer.status === "online" ? (
                <span className="flex gap-2 justify-center items-center text-green-500 font-medium">
                  <span className="flex h-2 w-2 rounded-full bg-green-500" />
                  Online
                </span>
              ) : (
                <span className="flex gap-2 justify-center items-center text-red-500 font-medium">
                  <span className="flex h-2 w-2 rounded-full bg-red-500" />
                  Offline
                </span>
              )}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-44">
          <ContextMenuItem
            className="text-md font-medium flex justify-between items-center cursor-pointer"
            inset
            onClick={() => setShowDialog(true)}
          >
            Editar
            <Pencil
              size={18}
              strokeWidth={1.5}
              absoluteStrokeWidth
              className="text-slate-950"
            />
          </ContextMenuItem>

          {printer.status !== "connecting" && (
            <ContextMenuItem
              className="text-md font-medium flex justify-between items-center cursor-pointer"
              inset
              onClick={() => {
                printer.device?.reconnect();
              }}
            >
              Reconectar
              <ArrowUpDown
                size={18}
                strokeWidth={1.5}
                absoluteStrokeWidth
                className="text-slate-950"
              />
            </ContextMenuItem>
          )}

          {printer.status === "online" && (
            <ContextMenuItem
              className="text-md font-medium flex justify-between items-center cursor-pointer"
              inset
              onClick={() => {
                printer.device?.printTest();
              }}
            >
              Probar
              <ReceiptText
                size={18}
                strokeWidth={1.5}
                absoluteStrokeWidth
                className="text-slate-950"
              />
            </ContextMenuItem>
          )}

          <AlertDialogTrigger asChild>
            <ContextMenuItem
              className="text-md font-medium flex justify-between items-center cursor-pointer hover:!bg-red-100"
              inset
            >
              Eliminar
              <Trash2
                size={18}
                strokeWidth={1.5}
                absoluteStrokeWidth
                className="text-slate-950"
              />
            </ContextMenuItem>
          </AlertDialogTrigger>
        </ContextMenuContent>
      </ContextMenu>
      <AlertDialogDeletePrinter name={printer.name} />
      <DialogPrinter
        open={showDialog}
        setOpen={setShowDialog}
        mode="edit"
        name={printer.name}
        ip={printer.ip}
      />
    </AlertDialog>
  );
};

export default PrinterAsideCard;
