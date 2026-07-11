export const ESCALA = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'LA#', 'SI'];

export const FACIL_MAYOR = [0, 2, 4, 7, 9];
export const FACIL_MENOR = [2, 4, 9];
export const FACIL_7 = [0, 2, 4, 7, 9];
export const FACIL_M7 = [2, 4, 9];
export const FACIL_5 = [0, 2, 4, 7, 9];
export const FACIL_M5 = [0, 2, 4, 7, 9];
export const FACIL_6 = [0, 2, 4, 7, 9];
export const FACIL_M6 = [2, 4, 9];
export const FACIL_9 = [0, 2, 4, 7, 9];
export const FACIL_M9 = [2, 4, 9];
export const MEDIO_MAYOR = [5, 11];
export const MEDIO_MENOR = [5, 11];

const NOTE_MAP_ES: Record<string, number> = {
  'do': 0, 'do#': 1, 're': 2, 're#': 3, 'mi': 4,
  'fa': 5, 'fa#': 6, 'sol': 7, 'sol#': 8, 'la': 9, 'la#': 10, 'si': 11,
};

const NOTE_MAP_EN: Record<string, number> = {
  'c': 0, 'c#': 1, 'd': 2, 'd#': 3, 'e': 4,
  'f': 5, 'f#': 6, 'g': 7, 'g#': 8, 'a': 9, 'a#': 10, 'b': 11,
};

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

export function transportarAcorde(acordeOriginal: string, semitonos: number): string {
  const parsed = parseAcorde(acordeOriginal);
  if (!parsed) return acordeOriginal;
  const nuevoIndice = ((parsed.indice + semitonos) % 12 + 12) % 12;
  const nota = ESCALA[nuevoIndice];
  const notaFormateada = nota.charAt(0) + nota.slice(1).toLowerCase();
  return notaFormateada + parsed.sufijo;
}

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

export function formatearAcorde(indice: number, esMenor: boolean, sufijo: string): string {
  const nota = ESCALA[indice];
  const notaFormateada = nota.charAt(0) + nota.slice(1).toLowerCase();
  return notaFormateada + sufijo;
}

const CHORD_PATTERN = /\b([A-Za-z#]{1,3}[0-9]*(?:-[0-9]*)?)\b/g;

export function transposeChordsInText(text: string, semitonos: number): string {
  if (semitonos === 0) return text;

  return text.replace(CHORD_PATTERN, (match) => {
    const parsed = parseAcorde(match);
    if (!parsed) return match;
    return transportarAcorde(match, semitonos);
  });
}

export type TextSegment = {text: string; isChord: boolean};

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
