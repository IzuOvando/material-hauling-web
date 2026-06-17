import {
  PropertyType,
  CONCRETO_DISTRIBUTION,
  ConcreteMaterialData,
} from "@/assets/data";
import getConcreteDescription from "@/utils/getConcreteDescription";

const propertyEntries = Object.entries(PropertyType);

/**
 * Vouchers store `material` either as plain text or as a JSON-encoded concrete
 * spec. This returns a human-readable description in both cases.
 */
export function getMaterialDescription(material: string | null | undefined): string {
  if (!material || material === "undefined") return "";

  try {
    const parsed: ConcreteMaterialData = JSON.parse(material);

    if (
      parsed &&
      typeof parsed === "object" &&
      "tipo" in parsed &&
      "fc" in parsed &&
      "tma" in parsed &&
      "dias" in parsed
    ) {
      const { tipo, fc, tma, dias, propiedades } = parsed;

      let selectedProps: PropertyType[] | undefined;

      if (Array.isArray(propiedades)) {
        selectedProps = propiedades
          .map((p) => {
            const match = propertyEntries.find(
              ([key]) => key.toLowerCase() === p.toLowerCase()
            );
            return match ? match[1] : null;
          })
          .filter((v): v is PropertyType => v !== null);
      }

      return getConcreteDescription(
        CONCRETO_DISTRIBUTION,
        tipo,
        fc.toString(),
        tma.toString(),
        dias.toString(),
        selectedProps
      );
    }
  } catch {
    return material;
  }

  return material;
}
