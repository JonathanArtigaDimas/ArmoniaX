/**
 * instruments.ts - Definición de instrumentos y sistema de notación musical
 *
 * Contiene:
 * - Interfaz Note (nota con nombre y frecuencia)
 * - Mapeo de notas anglófonas a hispanas (C→Do, D→Re, etc.)
 * - Funciones de conversión de notación
 * - Array de instrumentos soportados con sus cuerdas y frecuencias
 */

/** Representa una nota musical con su nombre (ej: "E2") y frecuencia en Hz */
export interface Note {
  name: string;      // Nombre en notación inglesa (ej: "E2", "A4")
  frequency: number; // Frecuencia en Hz (ej: 82.41 para E2)
}

/**
 * Mapa de conversión de notas inglesas a españolas.
 * Usado por getNoteInSpanish() para mostrar notas en español.
 */
const NOTE_MAP: Record<string, string> = {
  'C': 'Do',
  'C#': 'Do#',
  'D': 'Re',
  'D#': 'Re#',
  'E': 'Mi',
  'F': 'Fa',
  'F#': 'Fa#',
  'G': 'Sol',
  'G#': 'Sol#',
  'A': 'La',
  'A#': 'La#',
  'B': 'Si',
};

/**
 * Convierte una nota de notación inglesa a española.
 * Ejemplo: "E2" → "Mi2", "A4" → "La4", "C#5" → "Do#5"
 * @param noteName - Nota en notación inglesa con octava
 * @returns Nota en notación española con octava
 */
export function getNoteInSpanish(noteName: string): string {
  const match = noteName.match(/^([A-G]#?)(\d+)$/);
  if (!match) return noteName;
  const [, note, octave] = match;
  return (NOTE_MAP[note] || note) + octave;
}

/**
 * Devuelve el nombre de la nota según el sistema de notación activo.
 * @param noteName - Nota en notación inglesa
 * @param system - 'spanish' para español, 'english' para inglés
 * @returns Nota en el sistema solicitado
 */
export function getNoteName(noteName: string, system: 'spanish' | 'english'): string {
  if (system === 'english') return noteName;
  return getNoteInSpanish(noteName);
}

/** Representa un instrumento con sus cuerdas y notas disponibles */
export interface Instrument {
  id: string;         // Identificador único (ej: 'guitar', 'charango')
  name: string;       // Nombre para mostrar (ej: 'Guitarra')
  icon: string;       // Emoji del instrumento (ej: '🎸')
  notes: Note[];      // Array de notas/cuerdas del instrumento con sus frecuencias
}

/**
 * Array de instrumentos soportados por el afinador.
 * Cada instrumento define sus cuerdas con frecuencias estándar.
 *
 * Guitarra: 6 cuerdas E2-A2-D3-G3-B3-E4 (afinación estándar)
 * Charango: 5 cuerdas E5-A4-E4-C5-G4 (afinación estándar andina)
 */
export const INSTRUMENTS: Instrument[] = [
  {
    id: 'guitar',
    name: 'Guitarra',
    icon: '🎸',
    notes: [
      { name: 'E2', frequency: 82.41 },   // 6ta cuerda - Mi grave
      { name: 'A2', frequency: 110.0 },    // 5ta cuerda - La
      { name: 'D3', frequency: 146.83 },   // 4ta cuerda - Re
      { name: 'G3', frequency: 196.0 },    // 3ra cuerda - Sol
      { name: 'B3', frequency: 246.94 },   // 2da cuerda - Si
      { name: 'E4', frequency: 329.63 },   // 1ra cuerda - Mi agudo
    ],
  },
  {
    id: 'charango',
    name: 'Charango',
    icon: '🪕',
    notes: [
      { name: 'E5', frequency: 659.25 },   // Cuerda 1 - Mi agudo
      { name: 'A4', frequency: 440.0 },    // Cuerda 2 - La (440Hz = referencia estándar)
      { name: 'E4', frequency: 329.63 },   // Cuerda 3 - Mi
      { name: 'C5', frequency: 523.25 },   // Cuerda 4 - Do
      { name: 'G4', frequency: 392.0 },    // Cuerda 5 - Sol
    ],
  },
];
