import { findSiblingDisplayName } from "./frentes";

const frente = (nombre: string, displayName: string | null = null) => ({ nombre, displayName });

describe("findSiblingDisplayName", () => {
  it("returns the project name another frente of the same project has", () => {
    const frentes = [frente("PRUEBA-A1"), frente("PRUEBA-B2", "Proyecto de prueba")];

    expect(findSiblingDisplayName(frentes, "PRUEBA-A1")).toBe("Proyecto de prueba");
  });

  it("does not take the name of a project whose siglas start the same", () => {
    const frentes = [frente("PRUEBA-A1"), frente("PRUEBA2-A1", "Otro proyecto")];

    expect(findSiblingDisplayName(frentes, "PRUEBA-A1")).toBeNull();
    expect(findSiblingDisplayName(frentes, "PRUEBA2-A1")).toBeNull();
  });

  it("ignores the frente itself and frentes without a name", () => {
    const frentes = [frente("PRUEBA-A1", "Solo mi nombre"), frente("PRUEBA-B2")];

    expect(findSiblingDisplayName(frentes, "PRUEBA-A1")).toBeNull();
  });

  it("returns null when the project has a single frente", () => {
    expect(findSiblingDisplayName([frente("PRUEBA-A1")], "PRUEBA-A1")).toBeNull();
  });
});
