import { Checkbox } from "@/components/ui/checkbox";
import { useTicketsSelectionStore } from "@/store";
import { useEffect, useState } from "react";

export const TableTicketAllSelector = () => {
  const { setSelectAll, selectedAll } = useTicketsSelectionStore();

  const handleToggle = (value: boolean) => {
    setSelectAll(!!value);
  };

  return (
    <Checkbox
      checked={selectedAll}
      onCheckedChange={handleToggle}
      aria-label="Seleccionar todo"
      className="border-2 border-accent-dark !text-primary data-[state=checked]:bg-accent-dark w-5 h-5 pt-[1px] pl-[1px] mt-1"
    />
  );
};

export const TableTicketRowSelector = ({ row }: any) => {
  const { selectTicket, unselectTicket, selectedTickets, selectedAll } =
    useTicketsSelectionStore();
  const [checked, setChecked] = useState(
    selectedAll || !!selectedTickets[row.id]
  );

  const handleCheck = (value: boolean) => {
    if (value) {
      selectTicket(row.id);
    } else {
      unselectTicket(row.id);
    }
    setChecked(value);
  };

  useEffect(() => {
    setChecked(selectedAll);
  }, [selectedAll]);

  useEffect(() => {
    if (selectedTickets[row.id]) setChecked(true);
  }, [row.id, selectedTickets]);

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={handleCheck}
      disabled={selectedAll}
      aria-label="Selecccionar fila"
      className="border-2 border-primary !text-accent-dark data-[state=checked]:bg-primary w-5 h-5 pt-[1px] pl-[1px] mt-1"
    />
  );
};
