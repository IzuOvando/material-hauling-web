import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { getMaterials, deactivateMaterial } from "@/actions/materials";
import whiteLabelConfig from "#/white-label.config";
import { MaterialCatalogSection } from "./MaterialCatalogSection";

jest.mock("@/actions/materials", () => ({
  getMaterials: jest.fn(),
  createMaterial: jest.fn(),
  deactivateMaterial: jest.fn(),
  renameMaterial: jest.fn(),
}));
jest.mock("@/components/ui/use-toast", () => {
  const toast = jest.fn();
  return { useToast: () => ({ toast }) };
});

const copy = whiteLabelConfig.ui.materials.catalog;

const openDeleteDialog = async () => {
  const trigger = await waitFor(() => {
    const button = document.querySelector('button[class*="hover:text-red-500"]');
    expect(button).not.toBeNull();
    return button as HTMLElement;
  });
  fireEvent.click(trigger);
};

describe("MaterialCatalogSection deactivating a material", () => {
  let finish: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    (getMaterials as jest.Mock).mockResolvedValue([{ id: "m1", nombre: "Basalto", isActive: true }]);
    (deactivateMaterial as jest.Mock).mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
  });

  it("sends one request however many times the confirm button is tapped, and shows it is working", async () => {
    const onCatalogChange = jest.fn();
    render(<MaterialCatalogSection onCatalogChange={onCatalogChange} />);
    await openDeleteDialog();

    const confirm = await screen.findByRole("button", { name: copy.deleteDialogConfirm });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(deactivateMaterial).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: copy.deleting })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.deleteDialogCancel })).toBeDisabled();

    finish();
    await waitFor(() => expect(screen.queryByText("Basalto")).not.toBeInTheDocument());
    expect(onCatalogChange).toHaveBeenCalledTimes(1);
  });

  it("does not close the dialog before the request finishes", async () => {
    render(<MaterialCatalogSection />);
    await openDeleteDialog();

    fireEvent.click(await screen.findByRole("button", { name: copy.deleteDialogConfirm }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    finish();
  });
});
