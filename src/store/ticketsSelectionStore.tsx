import { create } from "zustand";

type TicketsSelectionState = {
  selectedTickets: {
    [uuid: string]: boolean;
  };
  selectedAll: boolean;
  setSelectAll: (value: boolean) => void;
  selectTicket: (uuid: string) => void;
  unselectTicket: (uuid: string) => void;
  resetSelection: () => void;
};

export const useTicketsSelectionStore = create<TicketsSelectionState>(
  (set) => ({
    selectedTickets: {},
    selectedAll: false,
    setSelectAll: (value) =>
      set((state) => ({
        selectedAll: value,
        selectedTickets: value ? {} : state.selectedTickets,
      })),
    selectTicket: (uuid) =>
      set((state) => ({
        selectedTickets: {
          ...state.selectedTickets,
          [uuid]: true,
        },
      })),
    unselectTicket: (uuid) =>
      set((state) => {
        const updatedSelection = { ...state.selectedTickets };
        delete updatedSelection[uuid];
        return {
          selectedTickets: updatedSelection,
        };
      }),
    resetSelection: () =>
      set((state) => ({
        selectedTickets: {},
        selectedAll: false,
      })),
  })
);
