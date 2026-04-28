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
import { usePrinterStore, useFrenteStore } from "@/store";
import {
  DistributedTicketPrinter,
  DistributedPrinterStatus,
} from "@/lib/printers";
import PrinterLittleCard from "../printers/PrinterLittleCard";
import { Printer, TicketArea } from "@/types";
import { ReceiptText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useToast } from "../ui/use-toast";

interface PrintDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  allSelected: boolean;
  ticketsIds: { [key: string]: boolean };
  frente: string;
  area: TicketArea;
  total: number;
}

const PrintDialog = ({
  open,
  setOpen,
  allSelected,
  ticketsIds,
  area,
  frente,
  total,
}: PrintDialogProps) => {
  const { printers } = usePrinterStore();
  const { selectedFrente, selectedArea } = useFrenteStore();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const availablePrinters = printers.filter(
    (printer) => printer.status === "online"
  );
  const ticketsIdsList = Object.keys(ticketsIds);
  const ticketsToPrint = allSelected
    ? total - ticketsIdsList.length
    : ticketsIdsList.length;

  const [ticketsPrinted, setTicketsPrinted] = useState(0);
  const [failedTickets, setFailedTickets] = useState(0);
  const [failedPrinters, setFailedPrinters] = useState<string[]>([]);
  const [actualView, setActualView] = useState<
    "start" | "finished" | "printing" | "printFailed"
  >("start");

  const distributedTicketPrinter = useRef<DistributedTicketPrinter | null>(
    null
  );

  const retrieveTickets = async () => {
    const body: {
      frente: string;
      area: TicketArea;
      allSelected: boolean;
      ticketsIds: string[];
    } = { frente, area, allSelected, ticketsIds: ticketsIdsList };

    const filters = searchParams.get("filters");
    const sort = searchParams.get("sort");
    const params = new URLSearchParams();

    if (filters) params.set("filters", filters);
    if (sort) params.set("sort", sort);

    const addFilter = params.size > 0 ? `?${params.toString()}` : "";

    try {
      const response = await fetch(`/api/frente/tickets${addFilter}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Error fetching tickets");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching tickets", error);
      return null;
    }
  };

  const handleStartPrinting = async () => {
    const ticketsToPrint = await retrieveTickets();

    if (ticketsToPrint === null) {
      toast({
        title: "Error",
        description: `Hubo un problema al obtener los tickets para imprimir, por favor intente nuevamente más tarde.`,
        variant: "destructive",
      });
      return;
    }

    distributedTicketPrinter.current = new DistributedTicketPrinter(
      availablePrinters,
      ticketsToPrint,
      handlePrintEvent,
      {
        frente: selectedFrente ? selectedFrente.nombre : "",
        area: selectedArea ? selectedArea : TicketArea.ACARREOS,
      }
    );

    distributedTicketPrinter.current.startPrinting();
    setActualView("printing");
  };

  const handlePrintEvent = (
    ticketsPrinted: number,
    failedPrintersNames: Set<string>,
    status: DistributedPrinterStatus,
    ticketsFailed: number
  ) => {
    setTicketsPrinted(ticketsPrinted);
    setFailedPrinters(Array.from(failedPrintersNames));

    switch (status) {
      case DistributedPrinterStatus.FINISHED:
        setActualView("finished");
        break;
      case DistributedPrinterStatus.WAITING_START_PRINTING_ERRORED:
        setFailedTickets(ticketsFailed);
        setActualView("printFailed");
        break;
      default:
        setActualView("printing");
    }
  };

  const handleOnClose = () => {
    setOpen(false);

    setTimeout(() => {
      setActualView("start");
      setTicketsPrinted(0);
    }, 1000);
  };

  const handleContinuePrinting = (name: string) => {
    if (distributedTicketPrinter.current)
      distributedTicketPrinter.current.reincludeFailedPrinter(name);
  };

  const handlePrintFailed = () => {
    if (distributedTicketPrinter.current)
      distributedTicketPrinter.current.startPrinting(true);
    setActualView("printing");
  };

  useEffect(() => {
    const handleFinishPrinting = () => {
      setActualView("finished");
    };

    if (
      actualView === "printing" &&
      ticketsPrinted === ticketsToPrint * 2 // Cause is original and copy
    )
      handleFinishPrinting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketsPrinted, actualView, ticketsToPrint]);

  return (
    <Dialog
      open={open}
      onOpenChange={actualView === "start" ? setOpen : undefined}
    >
      <DialogContent className="sm:max-w-[460px] sm:min-h-[332px] flex flex-col overflow-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Imprimir Vouchers</DialogTitle>
        </DialogHeader>
        {actualView === "start" ? (
          <StartView
            availablePrinters={availablePrinters}
            numberOfTickets={ticketsToPrint}
            onStartPrinting={handleStartPrinting}
            setOpen={setOpen}
          />
        ) : actualView === "printing" ? (
          <PrintingView
            ticketsPrinted={ticketsPrinted}
            totalTickets={ticketsToPrint}
            printers={printers}
            printersWithErrorNames={failedPrinters}
            continuePrinting={handleContinuePrinting}
          />
        ) : actualView === "printFailed" ? (
          <PrintingFailedView
            ticketsPrinted={ticketsPrinted}
            totalTickets={ticketsToPrint}
            printers={printers}
            printersWithErrorNames={failedPrinters}
            continuePrinting={handleContinuePrinting}
            ticketsFailed={failedTickets}
            onPrintFailed={handlePrintFailed}
          />
        ) : (
          <FinishedView totalTickets={ticketsToPrint} onClose={handleOnClose} />
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
  const [loading, setLoading] = useState(false);
  const handleShowPrinters = () => {
    const btn = document.getElementById("showPrinters");
    if (btn) btn.click();
    setOpen(false);
  };

  const handleOnStart = () => {
    setLoading(true);
    onStartPrinting();
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
          <PrinterLittleCard key={printer.name} printer={printer} disabled />
        ))}
      </div>
      <DialogFooter>
        <Button
          className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark w-full"
          onClick={handleOnStart}
          disabled={loading}
        >
          {loading ? "Preparando impresión..." : "Empezar Impresión"}
        </Button>
      </DialogFooter>
    </>
  );
};

const PrintingFailedView = ({
  ticketsPrinted,
  ticketsFailed,
  totalTickets,
  printers,
  printersWithErrorNames,
  onPrintFailed,
}: {
  ticketsPrinted: number;
  ticketsFailed: number;
  totalTickets: number;
  printers: Printer[];
  printersWithErrorNames: string[];
  continuePrinting: (name: string) => void;
  onPrintFailed: () => void;
}) => {
  const printersWithError = useMemo(
    () =>
      printers.filter((printers) =>
        printersWithErrorNames.includes(printers.name)
      ),
    [printersWithErrorNames, printers]
  );

  useEffect(() => {
    if (printersWithErrorNames.length > 0) {
      const timerReconnect = setTimeout(() => {
        for (const printer of printersWithError) {
          printer.device?.reconnect();
        }
      }, 2000);

      return () => {
        clearTimeout(timerReconnect);
      };
    }
  }, [printersWithErrorNames, printersWithError]);

  return (
    <div className="flex flex-1 justify-center items-center flex-col gap-8 mt-[-1rem] py-4">
      <div className="font-semibold text-center flex flex-col gap-2 items-center">
        Se han impreso exitosamente {ticketsPrinted * 2} de {totalTickets * 2}{" "}
        tickets.
        <ReceiptText
          size={130}
          strokeWidth={6}
          absoluteStrokeWidth
          color="rgb(var(--secondary-dark-color))"
        />
        Sin embargo, {ticketsFailed * 2} tickets fallaron en el proceso.
      </div>
      <Button
        className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark w-full"
        onClick={onPrintFailed}
      >
        Imprimir vouchers faltantes
      </Button>
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
              Luego, da click con botón secundario para volver a conectarlas y,
              una vez <b>online</b>, continuar imprimiendo.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const PrintingView = ({
  ticketsPrinted,
  totalTickets,
  printers,
  printersWithErrorNames,
  continuePrinting,
}: {
  ticketsPrinted: number;
  totalTickets: number;
  printers: Printer[];
  printersWithErrorNames: string[];
  continuePrinting: (name: string) => void;
}) => {
  const printersWithError = useMemo(
    () =>
      printers.filter((printers) =>
        printersWithErrorNames.includes(printers.name)
      ),
    [printersWithErrorNames, printers]
  );

  useEffect(() => {
    if (printersWithErrorNames.length > 0) {
      const timerReconnect = setTimeout(() => {
        for (const printer of printersWithError) {
          printer.device?.reconnect();
        }
      }, 2000);

      return () => {
        clearTimeout(timerReconnect);
      };
    }
  }, [printersWithErrorNames, printersWithError]);

  return (
    <div className="flex flex-1 justify-center items-center flex-col gap-8 mt-[-1rem] py-4">
      <div className="font-semibold">
        Se han impreso {ticketsPrinted * 2} de {totalTickets * 2} tickets...
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
                <PrinterLittleCard
                  key={printer.name}
                  printer={printer}
                  continuePrinting={continuePrinting}
                />
              ))}
            </div>
            <div className="justify-center text-center mb-4 px-3">
              Verifica si tienen papel, que no tengan obstrucciones y estén
              conectadas.
            </div>
            <div className="justify-center text-center mb-4 px-3">
              Luego, da click con botón secundario para volver a conectarlas y,
              una vez <b>online</b>, continuar imprimiendo.
            </div>
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
