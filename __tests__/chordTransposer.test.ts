/**
 * Pruebas del motor de transporte de acordes.
 *
 * Caso de referencia: "Noli me tangere" está en Do y usa Sib.
 * Al transportarlo a La, Sib debe convertirse en Sol (no en "Sol#b").
 */
import {
  parseAcorde,
  transportarAcorde,
  transposeChord,
  transposeKeyFifths,
  spellPitchClass,
} from '../src/utils/chordTransposer';
import {detectKeyFifths, parseChordPro} from '../src/utils/chordProParser';

describe('parseAcorde', () => {
  test('separa el bemol de la calidad del acorde', () => {
    expect(parseAcorde('Sib')).toMatchObject({
      nota: 'Sib',
      sufijo: '',
      indice: 10,
      accidente: -1,
      esMenor: false,
    });
    expect(parseAcorde('Sib-7')).toMatchObject({
      nota: 'Sib',
      sufijo: '-7',
      indice: 10,
      accidente: -1,
      esMenor: true,
    });
  });

  test('parsea sostenidos y bemoles en notación inglesa', () => {
    expect(parseAcorde('Bb')).toMatchObject({indice: 10, accidente: -1});
    expect(parseAcorde('F#m')).toMatchObject({indice: 6, accidente: 1, esMenor: true});
  });
});

describe('transporte sin tonalidad explícita', () => {
  test('Sib baja 3 semitonos y da Sol, nunca Sol#b', () => {
    expect(transportarAcorde('Sib', -3)).toBe('Sol');
  });

  test('conserva la calidad del acorde', () => {
    expect(transportarAcorde('Sib-7', -3)).toBe('Sol-7');
  });
});

describe('transporte con tonalidad destino', () => {
  test('Noli me tangere: Do → La', () => {
    const target = transposeKeyFifths(0, -3); // La mayor (3 sostenidos)
    expect(target).toBe(3);

    expect(transposeChord('Do', -3, true, {keyFifths: target})).toBe('La');
    expect(transposeChord('Fa', -3, true, {keyFifths: target})).toBe('Re');
    expect(transposeChord('Sol', -3, true, {keyFifths: target})).toBe('Mi');
    expect(transposeChord('La-', -3, true, {keyFifths: target})).toBe('Fa#-');
    expect(transposeChord('Re-', -3, true, {keyFifths: target})).toBe('Si-');
    expect(transposeChord('Sib', -3, true, {keyFifths: target})).toBe('Sol');
    expect(transposeChord('Sol#', -3, true, {keyFifths: target})).toBe('Fa');
  });

  test('no genera dobles alteraciones absurdas', () => {
    const target = transposeKeyFifths(0, -3);
    for (const chord of ['Do', 'Fa', 'Sol', 'La-', 'Re-', 'Sib', 'Sol#']) {
      const result = transposeChord(chord, -3, true, {keyFifths: target});
      expect(result).not.toMatch(/#b|b#|##|bb/);
    }
  });

  test('Do → Mib escribe bemoles coherentes', () => {
    const target = transposeKeyFifths(0, 3); // Mib mayor (-3)
    expect(target).toBe(-3);
    expect(transposeChord('Do', 3, true, {keyFifths: target})).toBe('Mib');
    expect(transposeChord('Sib', 3, true, {keyFifths: target})).toBe('Reb');
  });

  test('notación inglesa: Bb → G', () => {
    const target = transposeKeyFifths(0, -3);
    expect(transposeChord('Bb', -3, false, {keyFifths: target})).toBe('G');
  });
});

describe('escritura según armadura', () => {
  test('La mayor usa sostenidos diatónicos', () => {
    expect(spellPitchClass(6, true, {keyFifths: 3})).toBe('Fa#');
    expect(spellPitchClass(8, true, {keyFifths: 3})).toBe('Sol#');
    expect(spellPitchClass(1, true, {keyFifths: 3})).toBe('Do#');
  });

  test('Mib mayor usa bemoles diatónicos', () => {
    expect(spellPitchClass(10, true, {keyFifths: -3})).toBe('Sib');
    expect(spellPitchClass(3, true, {keyFifths: -3})).toBe('Mib');
    expect(spellPitchClass(8, true, {keyFifths: -3})).toBe('Lab');
  });

  test('evita Cb cuando no es diatónico', () => {
    // En Mib, el pc 11 es cromático: B es más simple que Cb.
    expect(spellPitchClass(11, true, {keyFifths: -3})).toBe('Si');
  });
});

describe('parseChordPro · Noli me tangere', () => {
  const noli = [
    '[Do]Mujer, dime, ¿por qué lloras?',
    '[Sib]¡Noli me[Do] tangere!',
    '[Lab]QUE SUBO AL PADRE MÍO',
    'Y PADRE [Sol]VUESTRO.',
  ].join('\n');

  test('detecta Do como tonalidad original', () => {
    expect(detectKeyFifths(noli)).toBe(0);
  });

  test('transpone a La sin "Sol#b" ni dobles alteraciones', () => {
    const lines = parseChordPro(noli, -3);
    const chords = lines.flatMap(line =>
      line.type === 'chordpro' ? line.chordPositions.map(c => c.chord) : [],
    );

    expect(chords).toEqual(['La', 'Sol', 'La', 'Fa', 'Mi']);
    expect(chords.join(' ')).not.toMatch(/#b|b#|##|bb/);
  });
});

describe('preferencia de sostenidos y bemoles', () => {
  const chordsOf = (text: string, semitones: number, accidental?: 'sharp' | 'flat') =>
    parseChordPro(text, semitones, undefined, accidental).flatMap(line =>
      line.type === 'chordpro' ? line.chordPositions.map(c => c.chord) : [],
    );

  test('modo sostenidos fuerza La# y evita bemoles', () => {
    expect(spellPitchClass(10, true, {accidental: 'sharp'})).toBe('La#');
    expect(transposeChord('Sib', 0, true, {accidental: 'sharp'})).toBe('La#');
    expect(transposeChord('Sib-7', 0, true, {accidental: 'sharp'})).toBe('La#-7');

    const chords = chordsOf('[Sib]Noli [Mib]me [Lab]tangere', 0, 'sharp');
    expect(chords).toEqual(['La#', 'Re#', 'Sol#']);
    expect(chords.join(' ')).not.toMatch(/b/);
  });

  test('modo bemoles fuerza Solb y evita sostenidos', () => {
    expect(spellPitchClass(6, true, {accidental: 'flat'})).toBe('Solb');
    expect(transposeChord('Fa#-', 0, true, {accidental: 'flat'})).toBe('Solb-');
    expect(transposeChord('La#', 0, true, {accidental: 'flat'})).toBe('Sib');

    const chords = chordsOf('[Fa#-]Dios [Do#]vivo [Sol#]santo', 0, 'flat');
    expect(chords).toEqual(['Solb-', 'Reb', 'Lab']);
    expect(chords.join(' ')).not.toMatch(/#/);
  });

  test('se mantiene la dirección al transportar', () => {
    const chords = chordsOf('[Reb]canto', -3, 'sharp');
    expect(chords).toEqual(['La#']);
  });

  test('funciona también en notación inglesa', () => {
    expect(transposeChord('Bb', 0, false, {accidental: 'sharp'})).toBe('A#');
    expect(transposeChord('F#m', 0, false, {accidental: 'flat'})).toBe('Gbm');
  });

  test('transporta también los bajos y secuencias con "/"', () => {
    expect(transposeChord('Si/La#/La', 0, true, {accidental: 'flat'})).toBe('Si/Sib/La');
    expect(transposeChord('Do/Mi', 3, true, {accidental: 'sharp'})).toBe('Re#/Sol');
  });

  test('modo profesional conserva la escritura original sin transporte', () => {
    expect(chordsOf('[Sib]Noli [Fa#-]me', 0)).toEqual(['Sib', 'Fa#-']);
    expect(parseChordPro('[Sib]Noli', 0)[0]).toMatchObject({type: 'chordpro'});
  });
});

describe('transposeKeyFifths', () => {
  test('calcula la armadura destino de todos los intervalos', () => {
    expect(transposeKeyFifths(0, 0)).toBe(0);
    expect(transposeKeyFifths(0, 1)).toBe(-5); // Reb
    expect(transposeKeyFifths(0, 2)).toBe(2);  // Re
    expect(transposeKeyFifths(0, 3)).toBe(-3); // Mib
    expect(transposeKeyFifths(0, 4)).toBe(4);  // Mi
    expect(transposeKeyFifths(0, 5)).toBe(-1); // Fa
    expect(transposeKeyFifths(0, 7)).toBe(1);  // Sol
    expect(transposeKeyFifths(0, 8)).toBe(-4); // Lab
    expect(transposeKeyFifths(0, 9)).toBe(3);  // La
    expect(transposeKeyFifths(0, 10)).toBe(-2); // Sib
    expect(transposeKeyFifths(0, 11)).toBe(5); // Si
  });
});
