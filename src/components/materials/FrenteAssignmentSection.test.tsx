import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  getFrenteMaterials,
  assignMaterialToFrente,
  unassignMaterialFromFrente,
} from "@/actions/materials";
import { FrenteAssignmentSection } from "./FrenteAssignmentSection";

jest.mock("@/actions/materials", () => ({
  getFrenteMaterials: jest.fn(),
  assignMaterialToFrente: jest.fn(),
  unassignMaterialFromFrente: jest.fn(),
}));
jest.mock("@/components/ui/use-toast", () => {
  const toast = jest.fn();
  return { useToast: () => ({ toast }) };
});
jest.mock("@/components/ui/select", () => ({
  Select: ({ onValueChange, children }: { onValueChange: (v: string) => void; children: React.ReactNode }) => (
    <div>
      <button onClick={() => onValueChange("PROJ-A1")}>pick frente</button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => null,
  SelectContent: () => null,
  SelectItem: () => null,
}));

const addButton = () => document.querySelector('button[class*="hover:bg-green-100"]') as HTMLButtonElement;
const removeButton = () => document.querySelector('button[class*="hover:bg-red-100"]') as HTMLButtonElement;

describe("FrenteAssignmentSection assigning and removing materials", () => {
  let finishAssign: () => void;
  let finishUnassign: () => void;

  beforeEach(async () => {
    jest.clearAllMocks();
    (getFrenteMaterials as jest.Mock).mockResolvedValue({
      assigned: [{ id: "a", nombre: "Asignado" }],
      available: [{ id: "b", nombre: "Disponible" }],
    });
    (assignMaterialToFrente as jest.Mock).mockReturnValue(new Promise<void>((resolve) => (finishAssign = resolve)));
    (unassignMaterialFromFrente as jest.Mock).mockReturnValue(new Promise<void>((resolve) => (finishUnassign = resolve)));

    render(<FrenteAssignmentSection frentes={["PROJ-A1"]} />);
    fireEvent.click(screen.getByText("pick frente"));
    await screen.findByText("Disponible");
  });

  it("sends one assign request however many times the plus button is tapped", async () => {
    fireEvent.click(addButton());
    fireEvent.click(addButton());

    expect(assignMaterialToFrente).toHaveBeenCalledTimes(1);
    expect(addButton()).toBeDisabled();
    expect(removeButton()).toBeDisabled();

    finishAssign();
    await waitFor(() => expect(addButton()).toBeNull());
  });

  it("sends one remove request however many times the remove button is tapped", async () => {
    fireEvent.click(removeButton());
    fireEvent.click(removeButton());

    expect(unassignMaterialFromFrente).toHaveBeenCalledTimes(1);
    expect(addButton()).toBeDisabled();

    finishUnassign();
    await waitFor(() => expect(removeButton()).toBeNull());
  });
});
