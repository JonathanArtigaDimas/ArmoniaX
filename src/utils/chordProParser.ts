import {transposeChord} from './chordTransposer';

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
