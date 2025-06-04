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
  'Subrasante',
  'Balasto',
  'Subbalasto',
  'Asfalto',
  'Grava',
  'Arena',
  'Cemento',
  'Concreto',
  'Otro...',
];

export const CONCRETO_DISTRIBUTION: ConcreteDistribution = {
  Basaltos: {
    '300': {
      '1/4': {
        '14': {
          descripcion:
            'Concreto premezclado f’c= 300 kg/cm2 a 14 "días, bombeable, TMA (Tamaño Máximo del Agregado) :¼", revenimiento nominal del concreto fresco 16 cm ± 3.5 cm, con macrofibras de plástico en un rango de 2-3% e impermeabilizante integral de cristalización al 2%.',
          revenimiento: '16 cm ± 3.5 cm',
        },
      },
      '3/4': {
        '14': {
          descripcion:
            'Concreto premezclado f’c= 300 kg/cm2 a 14 días, bombeable, TMA (Tamaño Máximo del Agregado) ¾”, revenimiento nominal de concreto fresco 16 cm ± 3.5 cm, con macroﬁbras de plástico en un rango de 2-3%.',
          revenimiento: '16 cm ± 3.5 cm',
        },
      },
    },
    '250': {
      '3/4': {
        '14': {
          properties: [PropertyType.Fibra, PropertyType.Microfibra],
          revenimiento: '16 cm ± 3.5 cm',
        },
        '3': {
          descripcion:
            'Concreto premezclado f’c= 250 kg/cm2 a 3 días, bombeable, TMA (Tamaño Máximo del Agregado)¾", revenimiento nominal de concreto fresco 16 cm± 3.5 cm, impermeabilizante integral de cristalización 1%.',
          revenimiento: '16 cm± 3.5 cm',
        },
      },
    },
    '200': {
      '3/4': {
        '28': {
          descripcion:
            'Concreto premezclado f’c= 200 kg/cm2 a 28 días, bombeable, TMA (Tamaño Máximo del Agregado) ¾", revenimiento nominal del concreto fresco 16 cm ± 3.5 cm, con macrofibras de plástico en un rango de 2-3%.',
          revenimiento: '16 cm± 3.5 cm',
        },
      },
    },
    '150': {
      '3/4': {
        '28': {
          properties: [PropertyType.Macrofibra],
          revenimiento: '16 cm ± 3.5 cm',
        },
      },
    },
    '100': {
      '3/4': {
        '28': {
          descripcion:
            'Concreto premezclado f’c= 100kg/cm2 a 28 días, tiro directo, TMA (Tamaño Máximo del Agregado) ¾”, revenimiento nominal del concreto fresco 10cm ± 2.5cm.',
          revenimiento: '16 cm ± 3.5 cm',
        },
      },
    },
    '45': {
      '1 1/2': {
        '28': {
          descripcion:
            'Concreto premezclado de Modulo de Ruptura (MR) 45 kg/cm2, TMA (Tamaño Máximo del Agregado) 1 ½”, revenimiento 8 cm ± 1.5 cm.',
          revenimiento: '8 cm ± 1.5 cm',
        },
      },
    },
  },
  Gamal: {
    '300': {
      '3/4': {
        '28': {
          descripcion:
            'Concreto premezclado fe= 300 kg/cm2 a 28 días, bonmbeable, TMA (Tamaño Máximo del Agregado) ¾",  revenimiento nominal del concreto fresco 16 cm ± 3.5 cm, Aditivo impermeabilizante integral 1-3% y fibras en  unI rango de 2-3%.',
          revenimiento: '16 cm ± 3.5 cm',
        },
      },
    },
    '250': {
      '3/4': {
        '14': {
          descripcion:
            'Concreto premezclado f’c= 250 kg/cm2 a 14 días, bombeable, TMA (Tamaño Máximo del Agregado) ¾",  revenimiento nominal de concreto fresco 16 cm± 3.5 cm, con macrofibras de plástico en un rango de 2-3% e impermeabilizante integral de cristalización 1%.',
          revenimiento: '16 cm ± 3.5 cm',
        },
      },
    },
    '200': {
      '3/4': {
        '28': {
          descripcion:
            'Concreto premezclado fe= 200 kg/cm2 a 28 días, tiro directo, TMA (Tamaño del Máximo de Agregado) 3/4" revenimiento nominal de concreto fresco de 10 cm ± 2.5cm , reforzado con fibras en un rango de 2-3%.',
          revenimiento: '10 cm ± 2.5cm',
        },
      },
    },
  },
  Reymaju: {
    '350': {
      '3/4': {
        '7': {
          descripcion:
            'Concreto premezclado f’c= 350 kg/cm2 a 7 días, bombeable, TMA (Tamaño Máximo del Agregado) ¾", revenimiento nominal del concreto fresco 16 cm ± 3.5 cm, aditivo impermeabilizante integral 1-3% según se requiera y fibras en un rango de 2-3%.',
          revenimiento: '16 cm ± 3.5 cm',
        },
      },
    },
  },
};
