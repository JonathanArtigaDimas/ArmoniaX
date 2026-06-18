export const ESCALA = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'LA#', 'SI'];

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
