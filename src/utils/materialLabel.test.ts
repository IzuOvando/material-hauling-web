import { resolveMaterialLabel, toMaterialLabels } from "./materialLabel";

const labels = toMaterialLabels([
  { nombre: "Tepetate", normalizedNombre: "tepetate" },
  { nombre: "Base Hidráulica", normalizedNombre: "base hidraulica" },
]);

describe("resolveMaterialLabel", () => {
  it.each([
    ["tepetate", "Tepetate"],
    ["TEPETATE", "Tepetate"],
    ["  Tepetate ", "Tepetate"],
    ["base hidraulica", "Base Hidráulica"],
    ["BASE HIDRÁULICA", "Base Hidráulica"],
  ])("shows the catalog spelling for %p", (stored, expected) => {
    expect(resolveMaterialLabel(stored, labels)).toBe(expected);
  });

  it("keeps a material the catalog doesn't know exactly as stored", () => {
    expect(resolveMaterialLabel("grazon fino", labels)).toBe("grazon fino");
  });

  it("does not merge materials that only look alike", () => {
    expect(resolveMaterialLabel("tepetates", labels)).toBe("tepetates");
    expect(resolveMaterialLabel("base  hidraulica", labels)).toBe("base  hidraulica");
  });

  it("leaves concrete JSON specs and empty values alone", () => {
    const json = '{"tipo":"Normal","fc":250,"tma":20,"dias":28}';
    expect(resolveMaterialLabel(json, labels)).toBe(json);
    expect(resolveMaterialLabel(` ${json}`, labels)).toBe(` ${json}`);
    expect(resolveMaterialLabel("", labels)).toBe("");
  });
});
