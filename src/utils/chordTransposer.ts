/**
 * chordTransposer.ts - Motor de transporte de acordes musicales
 *
 * Funcionalidades principales:
 * - Parseo de acordes en notación española (Do, Re, Mi...) e inglesa (C, D, E...)
 * - Soporte de sostenidos (#/♯), bemoles (b/♭) y dobles alteraciones
 * - Transporte por semitonos con escritura dependiente de la tonalidad
 * - Formateo de acordes a notación estándar
 * - Arrays de dificultad para cálculo de capo óptimo
 * - Segmentación de texto con acordes marcados
 *
 * El nombre de una nota no se elige al azar: la misma tecla puede escribirse
 * como sostenido o bemol (enarmonía), pero solo una forma es correcta según
 * la armadura y la función del acorde. Por eso el motor usa la línea de
 * quintas: cada nota se escribe en la posición más cercana a la tonalidad.
 *
 * El sistema de acordes usa guión "-" para menores (ej: "Am" → "La-").
 */

/** Escala cromática de 12 notas en mayúsculas (compatibilidad y parseo básico) */
export const ESCALA = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'LA#', 'SI'];

/**
 * Preferencia de escritura de alteraciones elegida por el usuario.
 * - 'professional': usa la armadura y la función armónica (recomendado).
 * - 'sharp': fuerza sostenidos en todas las notas alteradas.
 * - 'flat': fuerza bemoles en todas las notas alteradas.
 */
export type AccidentalPreference = 'professional' | 'sharp' | 'flat';

/** Dirección de alteración forzada (sin el modo profesional). */
export type AccidentalDirection = 'sharp' | 'flat';

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

/** Letras de las notas en notación española e inglesa */
const LETTERS_ES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
const LETTERS_EN = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Pitch class (0-11) de cada letra natural */
const LETTER_PC: Record<string, number> = {
  Do: 0, Re: 2, Mi: 4, Fa: 5, Sol: 7, La: 9, Si: 11,
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/**
 * Posición de cada letra natural en la línea de quintas.
 * Fa(-1) Do(0) Sol(1) Re(2) La(3) Mi(4) Si(5).
 * Cada sostenido suma +7 y cada bemol resta 7.
 */
const LETTER_FIFTHS: Record<string, number> = {
  Fa: -1, Do: 0, Sol: 1, Re: 2, La: 3, Mi: 4, Si: 5,
  F: -1, C: 0, G: 1, D: 2, A: 3, E: 4, B: 5,
};

/** Nombres de las 12 tonalidades en notación española */
const KEY_NAMES_SHARP = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const KEY_NAMES_FLAT = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];

/** Nombres de las 12 notas en notación inglesa, en cada dirección */
const NOTE_NAMES_SHARP_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT_EN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Normaliza cualquier entero al rango 0-11 */
function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

/** Convierte un texto de alteraciones ("#", "b", "##", "♭"...) a semitonos */
function accidentalValue(acc: string): number {
  let value = 0;
  for (const char of acc) {
    if (char === '#' || char === '♯') {
      value += 1;
    } else if (char === 'b' || char === '♭') {
      value -= 1;
    }
  }
  return value;
}

/** Convierte semitonos de alteración a texto ("#", "b", "##", "bb") */
function accidentalText(value: number): string {
  if (value === 0) {
    return '';
  }
  return value > 0 ? '#'.repeat(value) : 'b'.repeat(-value);
}

/** Opciones de escritura para transportar acordes. */
export interface TransposeOptions {
  /**
   * Armadura de la tonalidad destino en el círculo de quintas (-7..7).
   * Si se indica, las notas diatónicas se escriben según la armadura y las
   * cromáticas con el menor número de alteraciones posible.
   */
  keyFifths?: number;
  /** Dirección preferida para desempatar alteraciones cromáticas. */
  prefer?: AccidentalDirection;
  /**
   * Fuerza la escritura de todas las notas alteradas en una sola dirección.
   * Si se indica, ignora la armadura: 'sharp' → La# en vez de Sib,
   * 'flat' → Solb en vez de Fa#.
   */
  accidental?: AccidentalDirection;
}

/** Acorde parseado en sus componentes. */
export interface ParsedChord {
  /** Nota completa incluyendo alteración (ej: "Sib", "F#"). */
  nota: string;
  /** Sufijo o calidad del acorde (ej: "-", "7", "m7", "maj7"). */
  sufijo: string;
  /** true si el acorde es menor. */
  esMenor: boolean;
  /** Pitch class de la raíz (0-11). */
  indice: number;
  /** Alteración de la raíz en semitonos (-2..2). */
  accidente: number;
  /** Posición de la raíz en la línea de quintas. */
  fifths: number;
  /** true si la notación de entrada era española. */
  esSpanish: boolean;
}

/**
 * Parsea un acorde musical en sus componentes.
 *
 * Acepta notación española e inglesa, con sostenidos y bemoles:
 * - "Sib"   → { nota: "Sib", sufijo: "", indice: 10, accidente: -1 }
 * - "Sib-7" → { nota: "Sib", sufijo: "-7", esMenor: true, indice: 10 }
 * - "Bbm7"  → { nota: "Bb",  sufijo: "m7", esMenor: true, indice: 10 }
 * - "F#m"   → { nota: "F#",  sufijo: "m",  esMenor: true, indice: 6 }
 *
 * @param acorde - Cadena del acorde
 * @returns Objeto con los componentes, o null si no es un acorde válido
 */
export function parseAcorde(acorde: string): ParsedChord | null {
  const raw = acorde.trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/♯/g, '#').replace(/♭/g, 'b');

  // Notación española: Do, Re, Mi, Fa, Sol, La, Si (con 0-2 alteraciones)
  let match = normalized.match(/^(do|re|mi|fa|sol|la|si)([#b]{0,2})(.*)$/i);
  let esSpanish = true;

  // Notación inglesa: C, D, E, F, G, A, B (con 0-2 alteraciones)
  if (!match) {
    match = normalized.match(/^([a-g])([#b]{0,2})(.*)$/i);
    esSpanish = false;
  }

  if (!match) {
    return null;
  }

  const rawLetter = match[1];
  const letter = esSpanish
    ? rawLetter.charAt(0).toUpperCase() + rawLetter.slice(1).toLowerCase()
    : rawLetter.toUpperCase();
  const accidente = accidentalValue(match[2]);
  const sufijo = match[3];
  const indice = mod12(LETTER_PC[letter] + accidente);
  const fifths = LETTER_FIFTHS[letter] + 7 * accidente;
  const esMenor = /^-/.test(sufijo) || /^m(?!aj)/i.test(sufijo);

  return {
    nota: letter + accidentalText(accidente),
    sufijo,
    esMenor,
    indice,
    accidente,
    fifths,
    esSpanish,
  };
}

/**
 * Escribe una pitch class según la tonalidad destino.
 *
 * Reglas:
 * 1. Si la nota es diatónica a la armadura, se escribe con la letra y
 *    alteración exactas de la escala (prioridad absoluta).
 * 2. Si es cromática, se elige la escritura con menos alteraciones.
 * 3. En caso de empate se respeta la dirección original del acorde
 *    (sostenido/bemol) y, si no hay preferencia, la dirección de la tonalidad.
 *
 * Si `options.accidental` está definido, se ignora la armadura y se usa
 * exclusivamente la dirección solicitada (modo sostenidos o bemoles).
 *
 * Esto evita resultados como "Sol#b" y también dobles alteraciones
 * innecesarias como "Cb" en tonalidades que no las usan.
 *
 * @param pitchClass - Altura de la nota (0-11)
 * @param spanish - true para devolver notación española
 * @param options - Armadura destino y preferencia de alteración
 * @returns Nombre de la nota (ej: "Sib", "F#")
 */
export function spellPitchClass(
  pitchClass: number,
  spanish: boolean,
  options: TransposeOptions = {},
): string {
  const pc = mod12(pitchClass);

  // Modo forzado: una sola dirección para todas las alteraciones.
  if (options.accidental) {
    const names = options.accidental === 'sharp'
      ? (spanish ? KEY_NAMES_SHARP : NOTE_NAMES_SHARP_EN)
      : (spanish ? KEY_NAMES_FLAT : NOTE_NAMES_FLAT_EN);
    return names[pc];
  }

  const letters = spanish ? LETTERS_ES : LETTERS_EN;
  const {keyFifths, prefer} = options;

  // Escala diatónica de la tonalidad: 7 posiciones consecutivas de la línea de quintas.
  const diatonicMin = keyFifths !== undefined ? keyFifths - 1 : 0;
  const diatonicMax = keyFifths !== undefined ? keyFifths + 5 : 0;

  let best: {name: string; score: number} | null = null;

  for (const letter of letters) {
    for (let acc = -2; acc <= 2; acc++) {
      if (mod12(LETTER_PC[letter] + acc) !== pc) {
        continue;
      }

      const fifths = LETTER_FIFTHS[letter] + 7 * acc;
      let score: number;

      if (keyFifths !== undefined) {
        const isDiatonic = fifths >= diatonicMin && fifths <= diatonicMax;
        if (isDiatonic) {
          score = 0;
        } else {
          // Cromática: menos alteraciones primero; la distancia a la
          // armadura y la preferencia solo desempatan.
          score = 10 + Math.abs(acc) + Math.abs(fifths - keyFifths) * 0.01;
          if (Math.abs(acc) > 1) {
            score += 10;
          }
          if (prefer === 'sharp' && acc < 0) {
            score += 0.5;
          }
          if (prefer === 'flat' && acc > 0) {
            score += 0.5;
          }
        }
      } else {
        score = Math.abs(acc);
        if (Math.abs(acc) > 1) {
          score += 10;
        }
        if (prefer === 'sharp' && acc < 0) {
          score += 0.1;
        }
        if (prefer === 'flat' && acc > 0) {
          score += 0.1;
        }
      }

      if (!best || score < best.score) {
        best = {name: letter + accidentalText(acc), score};
      }
    }
  }

  return best ? best.name : (spanish ? 'Do' : 'C');
}

/**
 * Transporta un acorde por un número de semitonos.
 * Mantiene el sufijo (menor, 7, etc.) y solo cambia la nota raíz.
 *
 * @param acordeOriginal - Acorde en notación española o inglesa
 * @param semitonos - Número de semitonos a transportar (positivo = subir, negativo = bajar)
 * @param preferSpanish - Si true, devuelve en español; si false, en inglés
 * @param accidental - Si se indica, fuerza sostenidos o bemoles en la salida
 * @returns Acorde transportado
 *
 * Ejemplo: transportarAcorde("Do", 2) → "Re"
 * Ejemplo: transportarAcorde("Sib", -3) → "Sol"
 * Ejemplo: transportarAcorde("La-", -1) → "Sol#-"
 * Ejemplo: transportarAcorde("Sib", 0, true, "sharp") → "La#"
 */
export function transportarAcorde(
  acordeOriginal: string,
  semitonos: number,
  preferSpanish: boolean = true,
  accidental?: AccidentalDirection,
): string {
  // Bajos y secuencias con "/": transporta cada parte por separado.
  // Ej: "Do/Mi" → "Re/Fa#", "Si/La#/La" → "Si/Sib/La" en modo bemol.
  if (acordeOriginal.includes('/')) {
    return acordeOriginal
      .split('/')
      .map(part => transportarAcorde(part, semitonos, preferSpanish, accidental))
      .join('/');
  }

  const parsed = parseAcorde(acordeOriginal);
  if (!parsed) {
    return acordeOriginal;
  }

  const prefer = parsed.accidente < 0
    ? 'flat'
    : parsed.accidente > 0
      ? 'sharp'
      : undefined;

  const nota = spellPitchClass(parsed.indice + semitonos, preferSpanish, {
    prefer,
    accidental,
  });
  return nota + parsed.sufijo;
}

/**
 * Transporta un acorde soportando notación tanto española como inglesa.
 * Detecta automáticamente el sistema de notación del input.
 *
 * @param chord - Acorde en cualquier notación (ej: "Am", "La-", "C7", "Sib")
 * @param semitones - Semitonos a transportar
 * @param preferSpanish - Si true, devuelve en español; si false, en inglés
 * @param options - Armadura destino y preferencia de alteración
 * @returns Acorde transportado en el sistema solicitado
 */
export function transposeChord(
  chord: string,
  semitones: number,
  preferSpanish: boolean,
  options: TransposeOptions = {},
): string {
  // Bajos y secuencias con "/": transporta cada parte por separado.
  // Ej: "Do/Mi" → "Re/Fa#", "Si/La#/La" → "Si/Sib/La" en modo bemol.
  if (chord.includes('/')) {
    return chord
      .split('/')
      .map(part => transposeChord(part, semitones, preferSpanish, options))
      .join('/');
  }

  const parsed = parseAcorde(chord);
  if (!parsed) {
    return chord;
  }

  const prefer = options.prefer
    ?? (parsed.accidente < 0 ? 'flat' : parsed.accidente > 0 ? 'sharp' : undefined);

  const nota = spellPitchClass(parsed.indice + semitones, preferSpanish, {
    keyFifths: options.keyFifths,
    prefer,
    accidental: options.accidental,
  });

  return nota + parsed.sufijo;
}

/**
 * Calcula la armadura (círculo de quintas) de la tonalidad resultante
 * al transportar por un número de semitonos.
 *
 * Ejemplos:
 * - Do mayor (0) + 1 semitono  → Reb mayor (-5)
 * - Do mayor (0) + 3 semitonos → Mib mayor (-3)
 * - Do mayor (0) - 3 semitonos → La mayor (3)
 * - Do mayor (0) + 7 semitonos → Sol mayor (1)
 *
 * @param keyFifths - Armadura de la tonalidad original (-7..7)
 * @param semitones - Semitonos de transporte
 * @returns Armadura de la tonalidad destino (-7..7)
 */
export function transposeKeyFifths(keyFifths: number, semitones: number): number {
  const s = mod12(semitones);

  // El tritono tiene dos soluciones enarmónicas (±6 quintas). Se elige la
  // tonalidad con menos alteraciones.
  if (s === 6) {
    const up = normalizeFifths(keyFifths + 6);
    const down = normalizeFifths(keyFifths - 6);
    return Math.abs(up) <= Math.abs(down) ? up : down;
  }

  // Busca el desplazamiento de quintas más pequeño que equivalga a los semitonos.
  let bestK = 0;
  let bestDistance = Infinity;
  for (let k = -7; k <= 7; k++) {
    if (mod12(7 * k) !== s) {
      continue;
    }
    if (Math.abs(k) < bestDistance) {
      bestDistance = Math.abs(k);
      bestK = k;
    }
  }

  return normalizeFifths(keyFifths + bestK);
}

/** Mantiene una armadura en el rango -7..7 usando el enarmónico más cercano */
function normalizeFifths(fifths: number): number {
  let result = fifths;
  while (result > 7) {
    result -= 12;
  }
  while (result < -7) {
    result += 12;
  }
  return result;
}

/**
 * Devuelve el nombre de una tonalidad.
 * @param index - Pitch class de la tónica (0-11)
 * @param preferFlat - true para usar bemoles (Sib, Mib...)
 */
export function getKeyName(index: number, preferFlat: boolean = false): string {
  return (preferFlat ? KEY_NAMES_FLAT : KEY_NAMES_SHARP)[mod12(index)];
}

/**
 * Devuelve la etiqueta de una tonalidad, mostrando ambos enarmónicos
 * cuando existen (ej: "Do#/Reb").
 */
export function getKeyLabel(index: number): string {
  const pc = mod12(index);
  const sharp = KEY_NAMES_SHARP[pc];
  const flat = KEY_NAMES_FLAT[pc];
  return sharp === flat ? sharp : `${sharp}/${flat}`;
}

/**
 * Formatea un acorde a partir de sus componentes.
 * Capitaliza la primera letra de la nota y concatena el sufijo.
 *
 * @param indice - Índice cromático (0-11)
 * @param esMenor - Si el acorde es menor (el sufijo ya incluye "-" en la app)
 * @param sufijo - Sufijo adicional (ej: "7", "5", "9")
 * @param options - Armadura destino y preferencia de alteración
 * @returns Acorde formateado
 *
 * Ejemplo: formatearAcorde(0, false, "") → "Do"
 * Ejemplo: formatearAcorde(9, true, "7") → "La7"
 */
export function formatearAcorde(
  indice: number,
  esMenor: boolean,
  sufijo: string,
  options: TransposeOptions = {},
): string {
  const nota = spellPitchClass(indice, true, options);
  return nota + sufijo;
}

/** Patrón regex para detectar acordes en texto (ej: "Am7", "Do#", "Sib", "Bb") */
const CHORD_PATTERN = /\b((?:Do|Re|Mi|Fa|Sol|La|Si|[A-G])(?:#|b|♯|♭)?(?:maj|min|dim|aug|sus|add|m)?[0-9]*(?:[-+][0-9]*)?)\b/gi;

/**
 * Transporta todos los acordes encontrados en un texto.
 * Los acordes deben estar en formato estándar (letras, #, b, números).
 * El texto que no sea acorde se mantiene intacto.
 *
 * @param text - Texto que puede contener acordes
 * @param semitonos - Semitonos a transportar (0 = sin cambio)
 * @returns Texto con acordes transportados
 */
export function transposeChordsInText(text: string, semitonos: number): string {
  if (semitonos === 0) {
    return text;
  }

  return text.replace(CHORD_PATTERN, (match) => {
    const parsed = parseAcorde(match);
    if (!parsed) {
      return match;
    }
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

  const regex = new RegExp(CHORD_PATTERN.source, 'gi');
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
