import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Frente } from "@prisma/client";
import { TicketArea } from "@/types";

type FrenteState = {
  selectedFrente: Frente | null;
  selectedArea: TicketArea | null;
  refreshFacetsKey: number;
  setSelectedFrente: (frente: Frente) => void;
  setSelectedArea: (area: TicketArea) => void;
  refreshFacets: () => void;
  reset: () => void;
};

export const useFrenteStore = create<FrenteState>()(
  persist(
    (set) => ({
      selectedFrente: null,
      selectedArea: null,
      refreshFacetsKey: 0,
      setSelectedFrente: (frente: Frente) =>
        set({ selectedFrente: frente, refreshFacetsKey: 0 }),
      setSelectedArea: (area: TicketArea) =>
        set({ selectedArea: area, refreshFacetsKey: 0 }),
      refreshFacets: () =>
        set((state) => ({
          refreshFacetsKey: state.refreshFacetsKey + 1,
        })),
      reset: () =>
        set({ selectedFrente: null, selectedArea: null, refreshFacetsKey: 0 }),
    }),
    { name: "frentes", version: 2 }
  )
);
