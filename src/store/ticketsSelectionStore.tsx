import { create } from "zustand";

type TicketsSelectionState = {
  ticketsIds: {
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
    ticketsIds: {},
    selectedAll: false,
    setSelectAll: (value) =>
      set((state) => ({
        selectedAll: value,
        ticketsIds: {},
      })),
    selectTicket: (uuid) =>
      set((state) => {
        if (state.selectedAll)
          return {
            ticketsIds: dropTicket(uuid, state.ticketsIds),
          };
        else
          return {
            ticketsIds: pushTicket(uuid, state.ticketsIds),
          };
      }),
    unselectTicket: (uuid) =>
      set((state) => {
        if (state.selectedAll)
          return {
            ticketsIds: pushTicket(uuid, state.ticketsIds),
          };
        else
          return {
            ticketsIds: dropTicket(uuid, state.ticketsIds),
          };
      }),
    resetSelection: () =>
      set((state) => ({
        ticketsIds: {},
        selectedAll: false,
      })),
  })
);

const dropTicket = (
  uuid: string,
  ticketsIds: TicketsSelectionState["ticketsIds"]
) => {
  const updatedSelection = { ...ticketsIds };
  delete updatedSelection[uuid];
  return updatedSelection;
};

const pushTicket = (
  uuid: string,
  ticketsIds: TicketsSelectionState["ticketsIds"]
) => ({
  ...ticketsIds,
  [uuid]: true,
});
