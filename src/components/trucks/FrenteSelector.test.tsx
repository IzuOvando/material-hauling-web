import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Frente } from "@prisma/client";
import { FrenteSelector } from "./FrenteSelector";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const frentes = [{ nombre: "PROJ-A1", displayName: "Proyecto" }, { nombre: "PROJ-A2", displayName: "Proyecto" }] as Frente[];

describe("FrenteSelector opening a frente", () => {
  beforeEach(() => push.mockClear());

  it("opens the clicked frente under the base path", () => {
    render(<FrenteSelector frentes={frentes} basePath="/dashboard" />);

    const cards = screen.getAllByRole("button").filter((b) => b.textContent?.includes("A1"));
    fireEvent.click(cards[0]);

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/dashboard/PROJ-A1");
  });
});
