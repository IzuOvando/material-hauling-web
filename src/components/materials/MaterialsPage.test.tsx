import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import CONFIG from "@/config";
import whiteLabelConfig from "#/white-label.config";
import { MaterialsPage } from "./MaterialsPage";

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock("./MaterialCatalogSection", () => ({ MaterialCatalogSection: () => null }));
jest.mock("./FrenteAssignmentSection", () => ({ FrenteAssignmentSection: () => null }));

const copy = whiteLabelConfig.ui.materials.uncataloged;
const days = String(CONFIG.MATERIALS.UNCATALOGED_WINDOW_DAYS);

describe("MaterialsPage uncataloged warning", () => {
  it("shows nothing when every material used is in the catalog", () => {
    render(<MaterialsPage frentes={[]} uncataloged={[]} />);

    expect(screen.queryByText(copy.suffix, { exact: false })).not.toBeInTheDocument();
  });

  it("says how far back it looks and lists each material with its trips and frentes", () => {
    render(
      <MaterialsPage
        frentes={[]}
        uncataloged={[
          { nombre: "grava", viajes: 1, frentes: ["PROJ-A1"] },
          { nombre: "tepetate", viajes: 4, frentes: ["PROJ-A1", "PROJ-B2"] },
        ]}
      />
    );

    const warning = screen.getByText(copy.prefix.replace("{days}", days), { exact: false });
    expect(warning).toHaveTextContent(`grava (1 ${copy.tripOne} ${copy.in} PROJ-A1)`);
    expect(warning).toHaveTextContent(`tepetate (4 ${copy.tripMany} ${copy.in} PROJ-A1, PROJ-B2)`);
    expect(warning).toHaveTextContent(copy.suffix);
  });

  it("shortens a long list of frentes", () => {
    render(
      <MaterialsPage
        frentes={[]}
        uncataloged={[{ nombre: "grava", viajes: 9, frentes: ["A-1", "B-2", "C-3", "D-4", "E-5"] }]}
      />
    );

    expect(screen.getByText(copy.prefix.replace("{days}", days), { exact: false })).toHaveTextContent(
      `A-1, B-2, C-3 ${copy.more.replace("{n}", "2")}`
    );
  });
});
