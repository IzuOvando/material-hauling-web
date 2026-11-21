import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Frente } from "@prisma/client";
import whiteLabelConfig from "#/white-label.config";
import DeleteVouchersDialog from "./DeleteVouchersDialog";

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn(() => ({ dismiss: jest.fn() })) }),
}));

const copy = whiteLabelConfig.ui.vouchers;
const frente = { nombre: "PROJ-A1" } as Frente;
const FILTERED = "voucherDatetimeRange=2026-10-27..2026-10-28|status=ARRIVED";

const renderDialog = (props: { filters: string; total: number }) => {
  const setOpen = jest.fn();
  const onDeleted = jest.fn();
  render(
    <DeleteVouchersDialog open setOpen={setOpen} frente={frente} onDeleted={onDeleted} {...props} />
  );
  return { setOpen, onDeleted };
};

describe("DeleteVouchersDialog", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("says how many vouchers go and which filters select them when the table is filtered", () => {
    renderDialog({ filters: FILTERED, total: 3 });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(copy.deleteDialogScopedKeep)).toBeInTheDocument();
    expect(
      screen.getByText(`${whiteLabelConfig.ui.trucksFilters.statusLabelPrefix}: ${whiteLabelConfig.ui.trucksFilters.statusArrived}`)
    ).toBeInTheDocument();
  });

  it("keeps the all-records warning when no filter is active", () => {
    renderDialog({ filters: "", total: 27 });

    expect(screen.getByText(copy.deleteDialogWarningBold)).toBeInTheDocument();
    expect(screen.queryByText(copy.deleteDialogScopedKeep)).not.toBeInTheDocument();
  });

  it("sends the filters and the count it showed, then closes and reports the deletion", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ deleted: 3 }) });
    const { setOpen, onDeleted } = renderDialog({ filters: FILTERED, total: 3 });

    fireEvent.change(screen.getByPlaceholderText(frente.nombre), { target: { value: frente.nombre } });
    fireEvent.click(screen.getByRole("button", { name: copy.deleteButton }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ frenteNombre: frente.nombre, filters: FILTERED, expectedCount: 3 });
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("does not close or refresh when the server refuses the delete", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: "changed" }) });
    jest.spyOn(console, "error").mockImplementation(() => {});
    const { setOpen, onDeleted } = renderDialog({ filters: FILTERED, total: 3 });

    fireEvent.change(screen.getByPlaceholderText(frente.nombre), { target: { value: frente.nombre } });
    fireEvent.click(screen.getByRole("button", { name: copy.deleteButton }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: copy.deleteButton })).toBeEnabled());
    expect(onDeleted).not.toHaveBeenCalled();
    expect(setOpen).not.toHaveBeenCalled();
  });
});
