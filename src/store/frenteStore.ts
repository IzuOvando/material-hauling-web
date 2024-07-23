import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Frente } from "@prisma/client";
import { TicketArea } from "@/types";

type FrenteState = {
  selectedFrente: Frente | null;
  selectedArea: TicketArea | null;
  setSelectedFrente: (frente: Frente) => void;
  setSelectedArea: (area: TicketArea) => void;
  reset: () => void;
};

export const useFrenteStore = create<FrenteState>()(
  persist(
    (set) => ({
      selectedFrente: null,
      selectedArea: null,
      setSelectedFrente: (frente: Frente) => set({ selectedFrente: frente }),
      setSelectedArea: (area: TicketArea) => set({ selectedArea: area }),
      reset: () => set({ selectedFrente: null, selectedArea: null }),
    }),
    { name: "frentes", version: 1 }
  )
);
