/**
 * chordTransposer.ts - Motor de transporte de acordes musicales
 *
 * Funcionalidades principales:
 * - Parseo de acordes (ej: "Am", "Do7", "F#m")
 * - Transporte por semitonos
 * - Formateo de acordes a notación estándar
 * - Arrays de dificultad para cálculo de capo óptimo
 * - Segmentación de texto con acordes marcados
 *
 * Soporta notación tanto en español (Do, Re, Mi) como en inglés (C, D, E).
 * El sistema de acordes usa guión "-" para menores (ej: "Am" → "La-").
 */

/** Escala cromática de 12 notas en mayúsculas (usada para parseo) */
export const ESCALA = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'LA#', 'SI'];

/**
 * Arrays de dificultad para acordes de guitarra.
 * Cada array contiene los índices de notas (0-11) donde ese tipo de acorde
 * es "fácil" de tocar (cejilla simple o sin cejilla).
 *
 * Usado por encontrarMejorCapo() en TransposerScreen para calcular
 * la posición de capo que maximiza acordes fáciles.
 *
 * FACIL = fácil de tocar (sin cejilla compleja)
 * MEDIO = requiere cejilla pero es viable
 * Por defecto (no listado) = difícil
 */
export const FACIL_MAYOR = [0, 2, 4, 7, 9];        // Do, Re, Mi, Sol, La
export const FACIL_MENOR = [2, 4, 9];                // Re-, Mi-, La-
export const FACIL_7 = [0, 2, 4, 7, 9];             // Do7, Re7, Mi7, Sol7, La7
export const FACIL_M7 = [2, 4, 9];                   // Re-7, Mi-7, La-7
export const FACIL_5 = [0, 2, 4, 7, 9];             // Do5, Re5, Mi5, Sol5, La5
export const FACIL_M5 = [0, 2, 4, 7, 9];            // Do5-, Re5-, Mi5-, Sol5-, La5-
export const FACIL_6 = [0, 2, 4, 7, 9];             // Do6, Re6, Mi6, Sol6, La6
export const FACIL_M6 = [2, 4, 9];                   // Re-6, Mi-6, La-6
export const FACIL_9 = [0, 2, 4, 7, 9];             // Do9, Re9, Mi9, Sol9, La9
export const FACIL_M9 = [2, 4, 9];                   // Re-9, Mi-9, La-9
export const MEDIO_MAYOR = [5, 11];                  // Fa, Si (cejilla media)
export const MEDIO_MENOR = [5, 11];                  // Fa-, Si- (cejilla media)

/** Mapa de notas españolas a índice cromático (0-11) */
const NOTE_MAP_ES: Record<string, number> = {
  'do': 0, 'do#': 1, 're': 2, 're#': 3, 'mi': 4,
  'fa': 5, 'fa#': 6, 'sol': 7, 'sol#': 8, 'la': 9, 'la#': 10, 'si': 11,
};

/** Mapa de notas inglesas a índice cromático (0-11) */
const NOTE_MAP_EN: Record<string, number> = {
  'c': 0, 'c#': 1, 'd': 2, 'd#': 3, 'e': 4,
  'f': 5, 'f#': 6, 'g': 7, 'g#': 8, 'a': 9, 'a#': 10, 'b': 11,
};

/**
 * Parsea un acorde musical en sus componentes.
 *
 * @param acorde - Cadena del acorde (ej: "Am", "Do7", "F#m", "Bb")
 * @returns Objeto con nota, sufijo, si es menor e índice cromático, o null si no es válido
 *
 * Ejemplos:
 * - "Am" → { nota: "A", sufijo: "m", esMenor: true, indice: 9 }
 * - "Do7" → { nota: "Do", sufijo: "7", esMenor: false, indice: 0 }
 * - "F#m" → { nota: "F#", sufijo: "m", esMenor: true, indice: 6 }
 */
export function parseAcorde(acorde: string): {nota: string; sufijo: string; esMenor: boolean; indice: number} | null {
  const match = acorde.match(/^([a-zA-Z#]+)(.*)$/);
  if (!match) return null;
  const notaBase = match[1];
  const sufijo = match[2];
  const esMenor = sufijo.startsWith('-');
  const notaMayuscula = notaBase.toUpperCase();
  const indice = ESCALA.indexOf(notaMayuscula);
  if (indice === -1) return null;
  return {nota: notaBase, sufijo, esMenor, indice};
}

/**
 * Transporta un acorde por un número de semitonos.
 * Mantiene el sufijo (menor, 7, etc.) y solo cambia la nota raíz.
 *
 * @param acordeOriginal - Acorde en notación española (ej: "Do", "La-")
 * @param semitonos - Número de semitonos a transportar (positivo = subir, negativo = bajar)
 * @returns Acorde transportado
 *
 * Ejemplo: transportarAcorde("Do", 2) → "Re"
 * Ejemplo: transportarAcorde("La-", -1) → "Sol#-"
 */
export function transportarAcorde(acordeOriginal: string, semitonos: number): string {
  const parsed = parseAcorde(acordeOriginal);
  if (!parsed) return acordeOriginal;
  const nuevoIndice = ((parsed.indice + semitonos) % 12 + 12) % 12;
  const nota = ESCALA[nuevoIndice];
  const notaFormateada = nota.charAt(0) + nota.slice(1).toLowerCase();
  return notaFormateada + parsed.sufijo;
}

/**
 * Transporta un acorde soportando notación tanto española como inglesa.
 * Detecta automáticamente el sistema de notación del input.
 *
 * @param chord - Acorde en cualquier notación (ej: "Am", "La-", "C7")
 * @param semitonos - Semitonos a transportar
 * @param preferSpanish - Si true, devuelve en español; si false, en inglés
 * @returns Acorde transportado en el sistema solicitado
 */
export function transposeChord(chord: string, semitones: number, preferSpanish: boolean): string {
  const normalized = chord.trim().toLowerCase();
  let baseIndex: number | null = null;
  let suffix = '';

  const sortedEs = Object.entries(NOTE_MAP_ES)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [note, idx] of sortedEs) {
    if (normalized.startsWith(note)) {
      baseIndex = idx;
      suffix = chord.trim().slice(note.length);
      break;
    }
  }

  if (baseIndex === null) {
    const sortedEn = Object.entries(NOTE_MAP_EN)
      .sort((a, b) => b[0].length - a[0].length);
    for (const [note, idx] of sortedEn) {
      if (normalized.startsWith(note)) {
        baseIndex = idx;
        suffix = chord.trim().slice(note.length);
        break;
      }
    }
  }

  if (baseIndex === null) return chord;

  const newIndex = ((baseIndex + semitones) % 12 + 12) % 12;
  const scale = preferSpanish
    ? ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si']
    : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const newNote = scale[newIndex];

  if (preferSpanish) {
    return newNote.charAt(0).toUpperCase() + newNote.slice(1).toLowerCase() + suffix;
  }
  return newNote + suffix;
}

/**
 * Formatea un acorde a partir de sus componentes.
 * Capitaliza la primera letra de la nota y concatena el sufijo.
 *
 * @param indice - Índice cromático (0-11)
 * @param esMenor - Si el acorde es menor (agrega sufijo "-")
 * @param sufijo - Sufijo adicional (ej: "7", "5", "9")
 * @returns Acorde formateado
 *
 * Ejemplo: formatearAcorde(0, false, "") → "Do"
 * Ejemplo: formatearAcorde(9, true, "7") → "La-7"
 */
export function formatearAcorde(indice: number, esMenor: boolean, sufijo: string): string {
  const nota = ESCALA[indice];
  const notaFormateada = nota.charAt(0) + nota.slice(1).toLowerCase();
  return notaFormateada + sufijo;
}

/** Patrón regex para detectar acordes en texto (ej: "Am7", "Do#", "Bb") */
const CHORD_PATTERN = /\b([A-Za-z#]{1,3}[0-9]*(?:-[0-9]*)?)\b/g;

/**
 * Transporta todos los acordes encontrados en un texto.
 * Los acordes deben estar en formato estándar (letras, #, números).
 * El texto que no sea acorde se mantiene intacto.
 *
 * @param text - Texto que puede contener acordes
 * @param semitonos - Semitonos a transportar (0 = sin cambio)
 * @returns Texto con acordes transportados
 */
export function transposeChordsInText(text: string, semitonos: number): string {
  if (semitonos === 0) return text;

  return text.replace(CHORD_PATTERN, (match) => {
    const parsed = parseAcorde(match);
    if (!parsed) return match;
    return transportarAcorde(match, semitonos);
  });
}

/** Segmento de texto que puede ser acorde o texto normal */
export type TextSegment = {text: string; isChord: boolean};

/**
 * Divide un texto en segmentos de acordes y texto normal.
 * Usado para renderizar texto con acordes resaltados.
 *
 * @param text - Texto que puede contener acordes
 * @param semitonos - Semitonos a transportar (0 = sin cambio)
 * @returns Array de segmentos marcados como acorde o texto
 *
 * Ejemplo: parseTextSegments("Do amor", 0)
 * → [{text: "Do", isChord: true}, {text: " amor", isChord: false}]
 */
export function parseTextSegments(text: string, semitonos: number): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  const regex = new RegExp(CHORD_PATTERN.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({text: text.slice(lastIndex, match.index), isChord: false});
    }
    const chord = semitonos === 0 ? match[0] : transportarAcorde(match[0], semitonos);
    segments.push({text: chord, isChord: true});
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({text: text.slice(lastIndex), isChord: false});
  }

  return segments;
}
