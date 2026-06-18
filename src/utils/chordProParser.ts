const ESCALA_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ESCALA_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

const NOTE_MAP_ES_TO_EN: Record<string, number> = {
  'do': 0, 'do#': 1, 're': 2, 're#': 3, 'mi': 4,
  'fa': 5, 'fa#': 6, 'sol': 7, 'sol#': 8, 'la': 9, 'la#': 10, 'si': 11,
};

const NOTE_MAP_EN_TO_ES: Record<string, number> = {
  'c': 0, 'c#': 1, 'd': 2, 'd#': 3, 'e': 4,
  'f': 5, 'f#': 6, 'g': 7, 'g#': 8, 'a': 9, 'a#': 10, 'b': 11,
};

const CHORD_IN_BRACKET = /\[([^\]]+)\]/g;

const METADATA_TAG = /^\{([^:]+):\s*(.+)\}$/;

export type ChordProLineMetadata = {
  title?: string;
  subtitle?: string;
};

export type ChordProParsedLine =
  | {type: 'empty'; raw: string}
  | {type: 'metadata'; key: string; value: string; raw: string}
  | {type: 'chordpro'; lyricLine: string; chordPositions: {chord: string; position: number}[]; raw: string}
  | {type: 'plain'; text: string; raw: string};

function parseChordNote(chord: string): {
  baseIndex: number;
  suffix: string;
} | null {
  const normalized = chord.trim().toLowerCase();

  const sortedEs = Object.entries(NOTE_MAP_ES_TO_EN)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [note, idx] of sortedEs) {
    if (normalized.startsWith(note)) {
      const suffix = chord.trim().slice(note.length);
      return {baseIndex: idx, suffix};
    }
  }

  const sortedEn = Object.entries(NOTE_MAP_EN_TO_ES)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [note, idx] of sortedEn) {
    if (normalized.startsWith(note)) {
      const suffix = chord.trim().slice(note.length);
      return {baseIndex: idx, suffix};
    }
  }

  return null;
}

export function transposeChord(chord: string, semitones: number, preferSpanish: boolean): string {
  const parsed = parseChordNote(chord);
  if (!parsed) return chord;

  const newIndex = ((parsed.baseIndex + semitones) % 12 + 12) % 12;
  const scale = preferSpanish ? ESCALA_ES : ESCALA_EN;
  const newNote = scale[newIndex];

  if (preferSpanish) {
    return newNote.charAt(0).toUpperCase() + newNote.slice(1).toLowerCase() + parsed.suffix;
  }
  return newNote + parsed.suffix;
}

function hasSpanishChords(text: string): boolean {
  const lower = text.toLowerCase();
  return /\b(do|re|mi|fa|sol|la|si)[#b]?\b/.test(lower);
}

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
      return {
        type: 'metadata' as const,
        key: metaMatch[1].toLowerCase(),
        value: metaMatch[2],
        raw: line,
      };
    }

    CHORD_IN_BRACKET.lastIndex = 0;
    if (!CHORD_IN_BRACKET.test(line)) {
      return {type: 'plain' as const, text: line, raw: line};
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

    return {type: 'chordpro' as const, lyricLine, chordPositions, raw: line};
  });
}

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

export function getDisplayLines(lines: ChordProParsedLine[]): ChordProParsedLine[] {
  return lines.filter(l => l.type !== 'metadata');
}

const EASY_CHORDS = new Set([
  'Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si',
  'Re-', 'Mi-', 'La-',
  'Do7', 'Re7', 'Mi7', 'Fa7', 'Sol7', 'La7', 'Si7',
]);

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

export function isAllEasy(chords: string[]): boolean {
  return chords.length > 0 && chords.every(c => EASY_CHORDS.has(c));
}

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
