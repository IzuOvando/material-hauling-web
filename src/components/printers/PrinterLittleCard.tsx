import { useState } from "react";
import { Printer } from "@/types";
import { PrinterIcon, Pencil, ArrowUpDown, ReceiptText } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import DialogPrinter from "./DialogPrinter";

const PrinterLittleCard = ({
  printer,
  continuePrinting,
  disabled = false,
}: {
  printer: Printer;
  continuePrinting?: (name: string) => void;
  disabled?: boolean;
}) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger disabled={disabled}>
          <div className="flex items-center justify-center flex-col rounded-md border py-3 w-32 h-32">
            <PrinterIcon
              size={50}
              strokeWidth={4}
              absoluteStrokeWidth
              color="rgb(var(--accent-dark-color))"
            />
            <div className="w-full flex flex-col items-center">
              <span className="font-bold text-base text-center text-ellipsis overflow-hidden whitespace-nowrap w-full">
                {printer.name}
              </span>
              <span className="font-medium text-sm text-gray-600">
                {printer.ip}
              </span>
              {printer.status === "connecting" ? (
                <span className="flex gap-2 justify-center items-center text-sky-500 font-medium text-xs">
                  <span className="flex h-[0.3rem] w-[0.3rem] rounded-full bg-sky-500" />
                  Connecting...
                </span>
              ) : printer.status === "online" ? (
                <span className="flex gap-1 justify-center items-center text-green-500 font-medium text-xs">
                  <span className="flex h-[0.3rem] w-[0.3rem] rounded-full bg-green-500" />
                  Online
                </span>
              ) : printer.status === "offline" ? (
                <span className="flex gap-2 justify-center items-center text-red-500 font-medium text-xs">
                  <span className="flex h-[0.3rem] w-[0.3rem]  rounded-full bg-red-500" />
                  Offline
                </span>
              ) : (
                <span className="flex gap-2 justify-center items-center text-amber-500 font-medium text-xs">
                  <span className="flex h-[0.3rem] w-[0.3rem]  rounded-full bg-amber-500" />
                  Sin Papel
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

          {printer.status === "online" && continuePrinting !== undefined && (
            <ContextMenuItem
              className="text-md font-medium flex justify-between items-center cursor-pointer"
              inset
              onClick={() => continuePrinting(printer.name)}
            >
              Continuar Impresión
              <ReceiptText
                size={18}
                strokeWidth={1.5}
                absoluteStrokeWidth
                className="text-slate-950"
              />
            </ContextMenuItem>
          )}
        </ContextMenuContent>
        <DialogPrinter
          open={showDialog}
          setOpen={setShowDialog}
          mode="editip"
          name={printer.name}
          ip={printer.ip}
        />
      </ContextMenu>
    </>
  );
};

export default PrinterLittleCard;
