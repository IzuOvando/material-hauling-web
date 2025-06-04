import { ConcreteDistribution, PropertyType } from '@/assets/data';
import ConcreteUtilError from '@/errors/ConcreteError';

type ConcreteDescriptions = {
  [fcType: string]: {
    default: string;
    properties: {
      [property in PropertyType]?: string;
    };
  };
};

const concreteDescriptions: ConcreteDescriptions = {
  '250': {
    default:
      'Concreto premezclado fe= 250 kg/cm2 a 14 días, bombeable, TMA (Tamaño Máximo del Agregado)¾", revenimiento nominal del concreto fresco 16 cm ± 3.5 cm',
    properties: {
      [PropertyType.Fibra]:
        'Concreto premezclado f’c= 250 kg/cm2 a 14 días, bombeable, TMA (Tamaño Máximo del Agregado) ¾”, revenimiento nominal del concreto fresco 16 cm ± 3.5 cm, reforzado con fibras en un rango de 2-3%.',
      [PropertyType.Microfibra]:
        'Concreto premezclado f’c= 250 kg/cm2 a 14 días, bombeable, TMA (Tamaño Máximo del Agregado)¾", revenimiento nominal de concreto fresco 16 cm± 3.5 cm, con microfibras de plástico en un rango de 2-3%',
    },
  },
  '150': {
    default:
      'Concreto premezclado f’c= 150 kg/cm2 a 28 días, tiro directo, TMA (Tamaño Máximo del Agregado) ¾”, revenimiento nominal del concreto fresco 10 cm ± 2.5 cm.',
    properties: {
      [PropertyType.Macrofibra]:
        'Concreto premezclado f’c= 150 kg/cm2 a 28 días, bombeable, TMA (Tamaño Máximo del Agregado) ¾", revenimiento nominal del concreto fresco 16 cm ± 3.5 cm, con macrofibras de plástico en un rango de 2-3%.',
    },
  },
};

function getConcreteDescription(
  distribution: ConcreteDistribution,
  concreteType: string,
  fcType: string,
  tma: string,
  days: string,
  propertySelection?: PropertyType[]
): string {
  const concreteConfig = distribution[concreteType]?.[fcType]?.[tma]?.[days];

  if (!concreteConfig) {
    throw new ConcreteUtilError(
      'No se encontró la configuración especificada.'
    );
  }

  const fcDescriptions = concreteDescriptions[fcType];

  if (fcDescriptions && concreteConfig.properties) {
    if (propertySelection && propertySelection.length > 0) {
      for (const prop of propertySelection) {
        if (fcDescriptions.properties[prop]) {
          return fcDescriptions.properties[prop];
        }
      }
    }

    return fcDescriptions.default;
  }

  if (
    'descripcion' in concreteConfig &&
    typeof concreteConfig.descripcion === 'string'
  ) {
    return concreteConfig.descripcion;
  }

  throw new ConcreteUtilError('No se encontró la configuración especificada.');
}

export default getConcreteDescription;