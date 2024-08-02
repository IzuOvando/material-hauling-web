"use client";
import { useTableTickets } from "@/hooks";
import { createContext, useContext, ReactNode } from "react";

const TableTicketsContext = createContext<
  ReturnType<typeof useTableTickets> | undefined
>(undefined);

export const TableTicketsProvider = ({ children }: { children: ReactNode }) => {
  const tableTickets = useTableTickets();

  return (
    <TableTicketsContext.Provider value={tableTickets}>
      {children}
    </TableTicketsContext.Provider>
  );
};

export const useTableTicketsGlobal = () => {
  const context = useContext(TableTicketsContext);
  if (context === undefined) {
    throw new Error(
      "useTableTicketsContext must be used within a TableTicketsProvider"
    );
  }
  return context;
};
