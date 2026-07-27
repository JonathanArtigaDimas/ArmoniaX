/**
 * melodicFamilies.ts - Familias melódicas predefinidas
 *
 * Agrupa cantos por características melódicas similares.
 * Cada familia tiene un ajuste RELATIVO sobre la recomendación
 * automática de la app (calculatedOffset).
 */

export type MelodicFamily = {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  description: string;
  examples: string[];
  /** Ajuste relativo en semitonos sobre la recomendación automática */
  adjustment: number;
  tip: string;
};

export const MELODIC_FAMILIES: MelodicFamily[] = [
  {
    id: 'licorico_agudos',
    name: 'Bendice alma mía a Yahvé',
    subtitle: 'Lírico-Agudos',
    icon: '🎼',
    description:
      'Melodías amplias y estribillos épicos que suben a Mi4, Fa4, Sol4',
    examples: [
      'Es paciente',
      'Como destella el relámpago',
      'Levanto mis ojos a los montes',
      'Sola a solo',
      'Surgirá una gran luz',
      'El Señor es mi pastor',
    ],
    adjustment: -4,
    tip: 'Resta -4 a la recomendación para que tu voz no quede forzada en los agudos',
  },
  {
    id: 'recitativos_graves',
    name: 'Misericordia Mía',
    subtitle: 'Recitativos Graves',
    icon: '📜',
    description:
      'Cantos solemnes o salmódicos que rozan la zona más grave de la guitarra',
    examples: [
      'Por qué las gentes conspiran',
      'Misericordia Dios mío',
      'Débora',
      'A ti levanto mis ojos',
      'Gritos de júbilo',
    ],
    adjustment: +3,
    tip: 'Suma +3 a la recomendación para que tu voz suene con más brillo',
  },
  {
    id: 'festivos_salmos',
    name: 'Bendeciré al Señor en todo tiempo',
    subtitle: 'Festivos',
    icon: '🎉',
    description:
      'Ritmo rápido, muy melódicos. En Re+ proyectan agudos al final de frase',
    examples: [
      'Bendeciré al Señor en todo tiempo',
      'Huyamos, hermanos',
      'Te has llevado a mis hermanos',
      'Consolad a mi pueblo',
    ],
    adjustment: -1,
    tip: 'Resta -1 a la recomendación para aliviar el final de frase',
  },
  {
    id: 'flamencos_frigios',
    name: 'Gritad jubilosos',
    subtitle: 'Flamencos / Frigios',
    icon: '🔥',
    description:
      'Rítmicos, con rasgueo. Timbre desgarrado pero sin agudos sostenidos',
    examples: [
      'Canto de Moisés',
      'A la víctima pascual',
      'María de Nazaret',
      'Gritad jubilosos',
      'Una gran señal',
    ],
    adjustment: -1,
    tip: 'Resta -1 a la recomendación para no forzar el timbre',
  },
  {
    id: 'neutros_balanceados',
    name: 'Resucitó',
    subtitle: 'Neutros',
    icon: '⚖️',
    description:
      'Rango intermedio (La2 a Re4/Mi4). No exigen agudos extremos ni graves',
    examples: [
      'Resucitó',
      'Bendigamos al Señor',
      'Un retoño brota de la cepa de Jesé',
      'Hacia ti, morada santa',
      'Pentecostés',
    ],
    adjustment: 0,
    tip: 'Mantén la recomendación automática tal cual',
  },
];
