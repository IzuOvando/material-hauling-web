import { deriveTruckIdPrefix } from "./deriveTruckIdPrefix";

/**
 * CONTRACT TESTS — Truck ID Prefix Registry
 *
 * These tests act as a shared contract between the web and mobile apps.
 * Each registered tenant MUST have the same prefix in both repos.
 *
 * If you change an app.name, update the expected prefix here AND in the mobile repo.
 * If the values diverge, web-generated QRs will be unreadable by the mobile app.
 *
 * ⚠️  DO NOT change expected values without coordinating with the mobile team.
 */

describe("deriveTruckIdPrefix — logic", () => {
  it("3+ words → initials of first 3 words", () => {
    expect(deriveTruckIdPrefix("Constructora Veloz SA")).toBe("CVS");
    expect(deriveTruckIdPrefix("Infraestructura Norte Mexico")).toBe("INM");
  });

  it("2 words → first 3 chars of joined name", () => {
    expect(deriveTruckIdPrefix("Turist Trucks")).toBe("TUR");
    expect(deriveTruckIdPrefix("Material Hauling")).toBe("MAT");
  });

  it("1 word → first 3 chars", () => {
    expect(deriveTruckIdPrefix("Logistics")).toBe("LOG");
  });

  it("short name → padded with X", () => {
    expect(deriveTruckIdPrefix("AB")).toBe("ABX");
  });
});

describe("deriveTruckIdPrefix — tenant contract registry", () => {
  /**
   * ADD A ROW HERE for every tenant registered in clients/_registry.json.
   * The app.name must match exactly what is in tenant-assets/<tenant>/tenant.json
   * AND in the mobile app's client config for the same tenant.
   */
  const TENANT_REGISTRY: Array<{ tenant: string; appName: string; expectedPrefix: string }> = [
    { tenant: "sedena", appName: "SDN Transportes", expectedPrefix: "SDN" },
    { tenant: "constructora-aeris", appName: "Constructora Aeris", expectedPrefix: "CON" },
  ];

  /**
   * Tenants whose prefix is explicitly set (not derived from app.name).
   * The app name would derive a different prefix, so an explicit override is needed.
   */
  const EXPLICIT_REGISTRY: Array<{ tenant: string; appName: string; explicitPrefix: string }> = [
    // "Atlas Haul" would derive "ATL", but keeps "TUR" from its old name "Turist Trucks"
    { tenant: "turist-trucks", appName: "Atlas Haul", explicitPrefix: "TUR" },
  ];

  it.each(TENANT_REGISTRY)(
    "$tenant: deriveTruckIdPrefix('$appName') === '$expectedPrefix'",
    ({ appName, expectedPrefix }) => {
      expect(deriveTruckIdPrefix(appName)).toBe(expectedPrefix);
    }
  );

  it.each(EXPLICIT_REGISTRY)(
    '$tenant: explicit prefix "$explicitPrefix" (appName "$appName" would derive differently)',
    ({ appName, explicitPrefix }) => {
      expect(deriveTruckIdPrefix(appName)).not.toBe(explicitPrefix);
    }
  );
});
