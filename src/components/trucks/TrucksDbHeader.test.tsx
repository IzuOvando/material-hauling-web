import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Frente } from "@prisma/client";
import { TrucksDbHeader } from "./TrucksDbHeader";

const push = jest.fn();
const refresh = jest.fn();
const router = { push, refresh };
jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@/components/trucks", () => ({ DeleteVouchersDialog: () => null, CloseCycleSheet: () => null }));
jest.mock("@/components/frentes/AddFrenteDialog", () => () => null);
jest.mock("@/components/frentes/EditFrenteDialog", () => {
  const EditFrenteDialog = ({ onDeleteFrente }: { onDeleteFrente: (n: string) => void }) => (
    <button onClick={() => onDeleteFrente("PRUEBA-F1")}>confirm delete</button>
  );
  return EditFrenteDialog;
});

const frentes = [{ nombre: "PRUEBA-F1", displayName: "Proyecto" }] as Frente[];

describe("TrucksDbHeader deleting the frente being viewed", () => {
  it("goes back to the frente list and reloads it from the server", () => {
    render(<TrucksDbHeader frente="PRUEBA-F1" frentes={frentes} isOwner appliedFilters="" total={0} />);

    fireEvent.click(screen.getByText("confirm delete"));

    expect(push).toHaveBeenCalledWith("/db");
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
