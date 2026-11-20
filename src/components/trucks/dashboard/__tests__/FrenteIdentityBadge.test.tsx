import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { FrenteIdentityBadge } from "../FrenteIdentityBadge";

describe("FrenteIdentityBadge", () => {
  it("shows the logo with the frente in its alt text, plus the project name and label", () => {
    render(
      <FrenteIdentityBadge
        frente="TPCDMXP-F1"
        displayName="Tren Pachuca"
        logoUrl="https://example.com/logo.png"
      />
    );

    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/logo.png");
    expect(screen.getByRole("img").getAttribute("alt")).toContain("TPCDMXP-F1");
    expect(screen.getByText("Tren Pachuca")).toBeInTheDocument();
    expect(screen.getByText("TPCDMXP")).toBeInTheDocument();
    expect(screen.getByText("F1")).toBeInTheDocument();
  });

  it("shows the frente id in place of the logo when it has none", () => {
    render(<FrenteIdentityBadge frente="PROJ-A1" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // once in the placeholder, once in the PROJECT · ID label
    expect(screen.getAllByText("A1")).toHaveLength(2);
    expect(screen.getByText("PROJ")).toBeInTheDocument();
  });

  it("does not render the project name when the frente has none", () => {
    render(<FrenteIdentityBadge frente="PROJ-A1" />);

    expect(screen.queryByText("Tren Pachuca")).not.toBeInTheDocument();
  });

  it("handles a frente name without a dash", () => {
    render(<FrenteIdentityBadge frente="SOLO" />);

    // placeholder and label both use the project; no separator or empty suffix
    expect(screen.getAllByText("SOLO")).toHaveLength(2);
    expect(screen.queryByText("·")).not.toBeInTheDocument();
  });
});
