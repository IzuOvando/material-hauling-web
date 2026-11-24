import { sectionLeftByDeletedFrente } from "./frenteRoutes";

describe("sectionLeftByDeletedFrente", () => {
  it("returns the section list when the page shows the deleted frente", () => {
    expect(sectionLeftByDeletedFrente("/db/PRUEBA-F1", "PRUEBA-F1")).toBe("/db");
    expect(sectionLeftByDeletedFrente("/dashboard/PRUEBA-F1", "PRUEBA-F1")).toBe("/dashboard");
  });

  it("stays put on pages of other frentes, even with the same prefix", () => {
    expect(sectionLeftByDeletedFrente("/db/PRUEBA-F12", "PRUEBA-F1")).toBeNull();
    expect(sectionLeftByDeletedFrente("/db/PRUEBA2-F1", "PRUEBA-F1")).toBeNull();
  });

  it("stays put on pages without a frente", () => {
    expect(sectionLeftByDeletedFrente("/db", "PRUEBA-F1")).toBeNull();
    expect(sectionLeftByDeletedFrente("/materials", "PRUEBA-F1")).toBeNull();
  });
});
