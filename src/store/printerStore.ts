import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Printer } from "../types";
import { TicketPrinter } from "@/lib/printers";

interface PrinterState {
  printers: Printer[];
  addPrinter: (name: string, ip: string) => void;
  deletePrinter: (name: string) => void;
  editPrinter: (name: string, newName: string, ip: string) => void;
  changePrinterStatus: (
    name: string,
    status: "online" | "offline" | "connecting" | "paperEnd"
  ) => void;
  reconnectPrinters: () => void;
}

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set) => ({
      printers: [],
      addPrinter: (name, ip) =>
        set((state) => {
          const device = new TicketPrinter(ip, (status) => {
            state.changePrinterStatus(name, status);
          });

          return {
            printers: [
              ...state.printers,
              {
                name,
                ip,
                status: "connecting",
                device,
              },
            ],
          };
        }),
      deletePrinter: (name) =>
        set((state) => {
          return {
            printers: state.printers.filter((printer) => printer.name !== name),
          };
        }),
      editPrinter: (name, newName, ip) =>
        set((state) => {
          const printer = state.printers.find(
            (printer) => printer.name === name
          );
          if (!printer) return { printers: state.printers };

          const remainingPrinters = state.printers.filter(
            (printer) => printer.name !== name
          );

          let status;
          let device;

          if (printer.ip === ip) {
            status = printer.status;
            device = printer.device;
          } else {
            status = "connecting" as "connecting";
            device = new TicketPrinter(ip, (status) => {
              state.changePrinterStatus(name, status);
            });
          }

          const newPrinter: Printer = {
            name: newName,
            ip: ip,
            status: status,
            device: device,
          };

          return {
            printers: [...remainingPrinters, newPrinter],
          };
        }),
      changePrinterStatus: (name, status) =>
        set((state) => {
          const printer = state.printers.find(
            (printer) => printer.name === name
          );
          if (!printer) return { printers: state.printers };

          const remainingPrinters = state.printers.filter(
            (printer) => printer.name !== name
          );

          const newPrinter: Printer = {
            name: printer.name,
            ip: printer.ip,
            status: status,
            device: printer.device,
          };

          return {
            printers: [...remainingPrinters, newPrinter],
          };
        }),
      reconnectPrinters: () =>
        set((state) => {
          const newPrinters = state.printers.map((print) => {
            return {
              ip: print.ip,
              name: print.name,
              status: "connecting",
              device: new TicketPrinter(print.ip, (status) => {
                state.changePrinterStatus(print.name, status);
              }),
            } as Printer;
          });

          return {
            printers: newPrinters,
          };
        }),
    }),
    {
      name: "printers",
      version: 1,
      partialize: (state) => {
        return {
          printers: state.printers.map((printer) => {
            return {
              name: printer.name,
              ip: printer.ip,
              status: printer.status,
            };
          }),
        };
      },
    }
  )
);
