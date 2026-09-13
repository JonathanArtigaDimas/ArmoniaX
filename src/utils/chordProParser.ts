/**
 * chordProParser.ts - Parser de formato ChordPro
 *
 * Formato ChordPro: estándar para letras de canciones con acordes.
 * Los acordes van entre corchetes: [Am] [Do7] [Sol]
 * Los metadatos van entre llaves: {title: Nombre de la canción}
 *
 * Funcionalidades:
 * - Parseo de líneas a tipos (vacía, metadata, chordpro, plain)
 * - Transporte de acordes inline
 * - Extracción de acordes únicos
 * - Sugerencia de capo para acordes difíciles
 * - Detección de acordes fáciles
 */
import {transposeChord} from './chordTransposer';

/** Patrón para detectar acordes entre corchetes: [Am], [Do7], etc. */
const CHORD_IN_BRACKET = /\[([^\]]+)\]/g;

/** Patrón para metadatos ChordPro: {title: Nombre}, {subtitle: Subtítulo} */
const METADATA_TAG = /^\{([^:]+):\s*(.+)\}$/;

/** Directivas de formato que no son metadatos */
const FORMAT_DIRECTIVES = ['b', 'i', 'u', 'g', 'c'];

/** Patrón para detectar negrita ChordPro: {b:texto} */
const BOLD_TAG = /\{[bc]:(.+?)\}/g;

/** Segmento de texto con formato */
export type TextSegment = {text: string; bold: boolean};

/** Metadatos extraídos de líneas {key: value} */
export type ChordProLineMetadata = {
  title?: string;    // Título de la canción ({title: Nombre})
  subtitle?: string; // Subtítulo ({subtitle: Subtítulo})
};

/**
 * Línea parseada del ChordPro.
 * Tipos posibles:
 * - 'empty': línea vacía
 * - 'metadata': línea de metadatos {key: value}
 * - 'chordpro': línea con acordes [Am] y letra
 * - 'plain': línea solo de texto sin acordes
 */
export type ChordProParsedLine =
  | {type: 'empty'; raw: string}
  | {type: 'metadata'; key: string; value: string; raw: string}
  | {type: 'chordpro'; lyricLine: string; chordPositions: {chord: string; position: number}[]; segments: TextSegment[]; raw: string}
  | {type: 'plain'; text: string; segments: TextSegment[]; raw: string};

/**
 * Detecta si el texto contiene acordes en notación española.
 * Usado para decidir si transportar a español o inglés.
 */
function hasSpanishChords(text: string): boolean {
  const lower = text.toLowerCase();
  return /\b(do|re|mi|fa|sol|la|si)[#b]?\b/.test(lower);
}

/**
 * Detecta si un texto está en formato ChordPro.
 * Cuenta el número de acordes entre corchetes [chord].
 * Si hay al menos 1, se considera ChordPro.
 *
 * @param text - Texto a analizar
 * @returns true si parece ser ChordPro
 */
export function isChordPro(text: string): boolean {
  const lines = text.split('\n');
  let bracketCount = 0;
  for (const line of lines) {
    const matches = line.match(/\[[^\]]+\]/g);
    if (matches) {
      bracketCount += matches.length;
    }
  }
  return bracketCount >= 1;
}

/**
 * Parsea texto con directivas {b:texto} en segmentos con formato.
 * Ejemplo: "Hola {b:mundo} adiós" → [
 *   {text: "Hola ", bold: false},
 *   {text: "mundo", bold: true},
 *   {text: " adiós", bold: false}
 * ]
 */
function parseBoldSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  BOLD_TAG.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = BOLD_TAG.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({text: text.slice(lastIndex, match.index), bold: false});
    }
    segments.push({text: match[1], bold: true});
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({text: text.slice(lastIndex), bold: false});
  }

  return segments.length > 0 ? segments : [{text, bold: false}];
}

/**
 * Parsea un texto en formato ChordPro a un array de líneas tipadas.
 *
 * @param text - Texto completo en formato ChordPro
 * @param semitones - Semitonos para transportar acordes (0 = sin cambio)
 * @returns Array de líneas parseadas con su tipo y contenido
 *
 * El parser:
 * 1. Detecta líneas vacías
 * 2. Extrae metadatos {key: value}
 * 3. Parsea acordes [chord] y sus posiciones en la letra
 * 4. Identifica líneas de texto plano
 * 5. Transporta acordes si se solicita
 */
export function parseChordPro(
  text: string,
  semitones: number = 0,
): ChordProParsedLine[] {
  const lines = text.split('\n');
  const preferSpanish = hasSpanishChords(text);

  return lines.map(line => {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      return {type: 'empty' as const, raw: line};
    }

    const metaMatch = trimmed.match(METADATA_TAG);
    if (metaMatch) {
      // Las directivas de formato ({b:...}, {i:...}) no son metadatos
      if (!FORMAT_DIRECTIVES.includes(metaMatch[1].toLowerCase())) {
        return {
          type: 'metadata' as const,
          key: metaMatch[1].toLowerCase(),
          value: metaMatch[2],
          raw: line,
        };
      }
    }

    CHORD_IN_BRACKET.lastIndex = 0;
    if (!CHORD_IN_BRACKET.test(line)) {
      return {type: 'plain' as const, text: line, segments: parseBoldSegments(line), raw: line};
    }

    CHORD_IN_BRACKET.lastIndex = 0;

    let lyricLine = '';
    const chordPositions: {chord: string; position: number}[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = CHORD_IN_BRACKET.exec(line)) !== null) {
      const textBefore = line.slice(lastIndex, match.index);
      lyricLine += textBefore;

      const chord = semitones === 0
        ? match[1]
        : transposeChord(match[1], semitones, preferSpanish);

      chordPositions.push({chord, position: lyricLine.length});

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < line.length) {
      lyricLine += line.slice(lastIndex);
    }

    return {type: 'chordpro' as const, lyricLine, chordPositions, segments: parseBoldSegments(lyricLine), raw: line};
  });
}

/**
 * Extrae metadatos (título y subtítulo) de las líneas parseadas.
 * Busca líneas con key="title" o key="subtitle".
 */
export function extractMetadata(lines: ChordProParsedLine[]): ChordProLineMetadata {
  const meta: ChordProLineMetadata = {};
  for (const line of lines) {
    if (line.type === 'metadata') {
      if (line.key === 'title') meta.title = line.value;
      if (line.key === 'subtitle') meta.subtitle = line.value;
    }
  }
  return meta;
}

/**
 * Filtra las líneas para mostrar (excluye metadatos).
 * Usado para renderizar solo la letra y acordes.
 */
export function getDisplayLines(lines: ChordProParsedLine[]): ChordProParsedLine[] {
  return lines.filter(l => l.type !== 'metadata');
}

/**
 * Set de acordes considerados "fáciles" para guitarra.
 * Un acorde es fácil si se puede tocar sin cejilla compleja.
 * Incluye: Do, Re, Mi, Fa, Sol, La, Si (mayores)
 *          Re-, Mi-, La- (menores)
 *          Do7-Si7 (séptimas)
 */
const EASY_CHORDS = new Set([
  'Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si',
  'Re-', 'Mi-', 'La-',
  'Do7', 'Re7', 'Mi7', 'Fa7', 'Sol7', 'La7', 'Si7',
]);

/**
 * Extrae los acordes únicos de un texto ChordPro.
 * Preserva el orden de primera aparición.
 * Elimina duplicados (case-insensitive).
 *
 * @param text - Texto ChordPro con acordes entre corchetes
 * @returns Array de acordes únicos en orden de aparición
 */
export function extractUniqueChords(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const regex = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const chord = match[1].trim();
    if (!seen.has(chord.toLowerCase())) {
      seen.add(chord.toLowerCase());
      result.push(chord);
    }
  }
  return result;
}

/**
 * Verifica si todos los acordes del array son fáciles.
 * Usado para decidir si mostrar sugerencia de capo.
 *
 * @param chords - Array de acordes a verificar
 * @returns true si todos son fáciles (no necesita capo)
 */
export function isAllEasy(chords: string[]): boolean {
  return chords.length > 0 && chords.every(c => EASY_CHORDS.has(c));
}

/**
 * Sugiere la posición de capo que convierte todos los acordes a fáciles.
 * Prueba posiciones del 1 al 11 y retorna la primera donde todos son fáciles.
 *
 * @param chords - Array de acordes actuales
 * @returns Objeto con posición de capo y acordes resultantes, o null si no hay solución
 *
 * Ejemplo: suggestCapo(["Fa", "Sol", "La-"])
 * → { capo: 3, displayChords: ["Re", "Mi", "Fa-"] }
 * (con capo en traste 3, los acordes se vuelven fáciles)
 */
export function suggestCapo(
  chords: string[],
): {capo: number; displayChords: string[]} | null {
  if (chords.length === 0) return null;

  for (let capo = 1; capo <= 11; capo++) {
    const transposed = chords.map(c => transposeChord(c, -capo, true));
    const allEasy = transposed.every(c => EASY_CHORDS.has(c));
    if (allEasy) {
      return {capo, displayChords: transposed};
    }
  }
  return null;
}
