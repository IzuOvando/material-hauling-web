/**
 * @deprecated Materials are now managed per-frente in the database via the Material model.
 * See prisma/schema.prisma. CONCRETO_DISTRIBUTION is deprecated — concrete flow has been removed.
 * MATERIALS_LIST is no longer the source of truth — use GET /api/mobile/materials.
 * This file is kept for backward compatibility with VoucherInfoClient.tsx and QR parsing.
 */

export enum PropertyType {
  Fibra = 0,
  Microfibra = 1,
  Macrofibra = 2,
  Impermeabilizante = 3,
  Bombeable = 4,
}

export type ConcreteMaterialData = {
  tipo: string;
  fc: string;
  tma: string;
  dias: string;
  propiedades?: string[];
};

export type ConcreteProperties = (
  | { properties: PropertyType[]; descripcion?: never }
  | { descripcion: string; properties?: never }
) & { revenimiento: string };

export type ConcreteDistribution = {
  [concreteType: string]: {
    [fcType: string]: {
      [tma: string]: {
        [days: string]: ConcreteProperties;
      };
    };
  };
};

export const MATERIALS_LIST: string[] = [
  'Terraplén',
  'Pedraplén',
  'Transición',
  'Subrasante',
  'Subbalasto',
  'Balasto',
  'Asfalto',
  'Base Hidráulica',
  'Grava',
  'Arena',
  'Concreto',
];

/**
 * @deprecated Concrete brands (Basaltos, Gamal, Reymaju) were removed as part of
 * white-label generalization. Concrete data is now managed per-frente in the database.
 */
export const CONCRETO_DISTRIBUTION: ConcreteDistribution = {};
