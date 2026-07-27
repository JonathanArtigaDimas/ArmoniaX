/**
 * melodicFamilies.ts - Familias melódicas predefinidas
 *
 * Agrupa cantos por características melódicas similares.
 * Cada familia tiene un offset fijo de transporte que funciona
 * bien para la mayoría de voces en ese estilo.
 */

export type MelodicFamily = {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  description: string;
  examples: string[];
  /** Offset fijo en semitonos */
  offset: number;
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
    offset: -1,
    tip: 'Baja -1 semitono para que tu voz no quede forzada en los agudos',
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
    offset: +3,
    tip: 'Sube +3 semitonos para que tu voz suene con más brillo',
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
    offset: -1,
    tip: 'Baja -1 semitono para aliviar el final de frase',
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
    offset: -1,
    tip: 'Baja -1 semitono para no forzar el timbre',
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
    offset: 0,
    tip: 'Tono original, sin cambio necesario',
  },
];

/**
 * Retorna el offset fijo de una familia.
 */
export function getFamilyOffset(family: MelodicFamily): number {
  return family.offset;
}
