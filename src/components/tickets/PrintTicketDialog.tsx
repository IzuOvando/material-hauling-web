"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePrinterStore } from "@/store";
import { Ticket } from "@prisma/client";
import { DistributedTicketPrinter } from "@/lib/printers";
import PrinterLittleCard from "../printers/PrinterLittleCard";
import { Printer } from "@/types";
import { ReceiptText } from "lucide-react";

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
  const availablePrinters = printers.filter(
    (printer) => printer.status === "online"
  );
  const selectedTickets = Object.keys(ticketsSelection);

  const [ticketsPrinted, setTicketsPrinted] = useState(0);
  const [failedPrinters, setFailedPrinters] = useState<string[]>([]);
  const [actualView, setActualView] = useState<
    "start" | "finished" | "printing"
  >("start");

  const distributedTicketPrinter = useRef<DistributedTicketPrinter | null>(
    null
  );

  const handleStartPrinting = () => {
    const ticketsToPrint = tickets.filter((ticket) =>
      selectedTickets.includes(ticket.uuid)
    );

    distributedTicketPrinter.current = new DistributedTicketPrinter(
      availablePrinters,
      ticketsToPrint,
      handlePrinterFailed,
      handleTicketPrint
    );

    distributedTicketPrinter.current.startPrinting();
    setActualView("printing");
  };

  const handlePrinterFailed = (printer: string) => {
    setFailedPrinters((prev) => [...prev, printer]);
  };

  const handleTicketPrint = () => {
    setTicketsPrinted((prev) => prev + 1);
  };

  const handleOnClose = () => {
    setOpen(false);

    setTimeout(() => {
      setActualView("start");
      setTicketsPrinted(0);
    }, 1000);
  };

  const handleReconnectPrinters = () => {
    if (distributedTicketPrinter.current)
      distributedTicketPrinter.current?.retryFailedPrinters();
    setFailedPrinters([]);
  };

  useEffect(() => {
    const handleFinishPrinting = () => {
      setActualView("finished");
    };

    if (
      actualView === "printing" &&
      ticketsPrinted === selectedTickets.length * 2 // Cause is original and copy
    )
      handleFinishPrinting();
  }, [ticketsPrinted]);

  return (
    <Dialog
      open={open}
      onOpenChange={actualView === "start" ? setOpen : undefined}
    >
      <DialogContent className="sm:max-w-[460px] sm:min-h-[332px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Imprimir Tickets</DialogTitle>
        </DialogHeader>
        {actualView === "start" ? (
          <StartView
            availablePrinters={availablePrinters}
            numberOfTickets={selectedTickets.length}
            onStartPrinting={handleStartPrinting}
            setOpen={setOpen}
          />
        ) : actualView === "printing" ? (
          <PrintingView
            ticketsPrinted={ticketsPrinted}
            totalTickets={selectedTickets.length}
            printers={printers}
            printersWithErrorNames={failedPrinters}
            handleReconnectPrinters={handleReconnectPrinters}
          />
        ) : (
          <FinishedView
            totalTickets={selectedTickets.length}
            onClose={handleOnClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const StartView = ({
  setOpen,
  availablePrinters,
  numberOfTickets,
  onStartPrinting,
}: {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  availablePrinters: Printer[];
  numberOfTickets: number;
  onStartPrinting: () => void;
}) => {
  const handleShowPrinters = () => {
    const btn = document.getElementById("showPrinters");
    if (btn) btn.click();
    setOpen(false);
  };

  if (availablePrinters.length === 0)
    return (
      <>
        <div className="flex-1 flex justify-center items-center flex-col gap-5">
          <div className="w-full text-center text-lg font-bold">
            No hay impresoras disponibles
          </div>
          <div className="w-full text-justify text-base text-gray-700">
            Ve al apartado <b>&quot;Ver impresoras&quot;</b> para agregar nuevas
            impresoras, reconectarlas si están desconectadas o verificar si
            tienen papel.
          </div>
        </div>
        <DialogFooter>
          <Button
            className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark"
            onClick={handleShowPrinters}
          >
            Ver Impresoras
          </Button>
        </DialogFooter>
      </>
    );

  return (
    <>
      <div className="w-full text-justify text-base text-gray-700">
        Se imprimirán <b>{numberOfTickets * 2} tickets</b> (original y copia) en
        las siguientes impresoras disponibles:
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {availablePrinters.map((printer) => (
          <PrinterLittleCard key={printer.name} printer={printer} />
        ))}
      </div>
      <DialogFooter>
        <Button
          className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark w-full"
          onClick={onStartPrinting}
        >
          Empezar Impresión
        </Button>
      </DialogFooter>
    </>
  );
};

const PrintingView = ({
  ticketsPrinted,
  totalTickets,
  printers,
  printersWithErrorNames,
  handleReconnectPrinters,
}: {
  ticketsPrinted: number;
  totalTickets: number;
  printers: Printer[];
  printersWithErrorNames: string[];
  handleReconnectPrinters: () => void;
}) => {
  const [disabledButton, setDisabledButton] = useState(true);

  const printersWithError = useMemo(
    () =>
      printers.filter((printers) =>
        printersWithErrorNames.includes(printers.name)
      ),
    [printersWithErrorNames, printers]
  );

  useEffect(() => {
    if (printersWithErrorNames.length > 0) {
      setDisabledButton(true);

      const timerReconnect = setTimeout(() => {
        for (const printer of printersWithError) {
          printer.device?.reconnect();
        }
      }, 2000);

      const timerDisable = setTimeout(() => {
        setDisabledButton(false);
      }, 5000);

      return () => {
        clearTimeout(timerReconnect);
        clearTimeout(timerDisable);
      };
    }
  }, [printersWithErrorNames]);

  return (
    <div className="flex flex-1 justify-center items-center flex-col gap-8 mt-[-1rem] py-4">
      <div className="font-semibold">
        Se han impreso {ticketsPrinted} de {totalTickets * 2} tickets...
      </div>
      <span className="loader"></span>
      {printersWithErrorNames.length > 0 && (
        <>
          <hr className="bg-secondary h-1 w-full" />
          <div>
            <div className="justify-center text-center mb-4 px-2">
              Las siguientes impresoras no pueden seguir imprimiendo:
            </div>
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {printersWithError.map((printer) => (
                <PrinterLittleCard key={printer.name} printer={printer} />
              ))}
            </div>
            <div className="justify-center text-center mb-4 px-3">
              Verifica si tienen papel, que no tengan obstrucciones y estén
              conectadas.
            </div>
            <div className="justify-center text-center mb-4 px-3">
              Luego da click aquí para seguir imprimiendo con ellas.
            </div>
            <Button
              className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark w-full"
              onClick={handleReconnectPrinters}
              disabled={disabledButton}
            >
              Reconectar Impresoras
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const FinishedView = ({
  totalTickets,
  onClose,
}: {
  totalTickets: number;
  onClose: () => void;
}) => {
  return (
    <div className="flex flex-1 justify-center items-center flex-col mt-[-1rem] py-4">
      <div className="font-semibold text-xl text-center">
        Se han impreso los {totalTickets * 2} tickets correctamente
      </div>
      <ReceiptText
        size={150}
        strokeWidth={6}
        absoluteStrokeWidth
        color="rgb(var(--accent-dark-color))"
        className="my-3"
      />
      <DialogFooter className="w-full">
        <Button
          className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark w-full"
          onClick={onClose}
        >
          Terminar Impresión
        </Button>
      </DialogFooter>
    </div>
  );
};

export default PrintDialog;
