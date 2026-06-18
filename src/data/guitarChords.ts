export interface ChordData {
  name: string;
  label: string;
  frets: number[];
}

export interface ChordGroup {
  title: string;
  chords: ChordData[];
}

// Guitar standard tuning: E A D G B E (strings 6→1, low→high)
// frets[0] = string 6 (low E), frets[5] = string 1 (high E)
// -1 = muted (x), 0 = open (o), 1-5 = fret number

const MAYORES: ChordData[] = [
  {name: 'C', label: 'Do', frets: [-1, 3, 2, 0, 1, 0]},
  {name: 'C#', label: 'Do#', frets: [-1, 4, 6, 6, 6, 4]},
  {name: 'D', label: 'Re', frets: [-1, -1, 0, 2, 3, 2]},
  {name: 'D#', label: 'Re#', frets: [-1, -1, 1, 3, 4, 3]},
  {name: 'E', label: 'Mi', frets: [0, 2, 2, 1, 0, 0]},
  {name: 'F', label: 'Fa', frets: [1, 3, 3, 2, 1, 1]},
  {name: 'F#', label: 'Fa#', frets: [2, 4, 4, 3, 2, 2]},
  {name: 'G', label: 'Sol', frets: [3, 2, 0, 0, 0, 3]},
  {name: 'G#', label: 'Sol#', frets: [4, 6, 6, 5, 4, 4]},
  {name: 'A', label: 'La', frets: [-1, 0, 2, 2, 2, 0]},
  {name: 'A#', label: 'La#', frets: [-1, 1, 3, 3, 3, 1]},
  {name: 'B', label: 'Si', frets: [-1, 2, 4, 4, 4, 2]},
];

const MENORES: ChordData[] = [
  {name: 'Cm', label: 'Do-', frets: [-1, 3, 5, 5, 4, 3]},
  {name: 'C#m', label: 'Do#-', frets: [-1, 4, 6, 6, 5, 4]},
  {name: 'Dm', label: 'Re-', frets: [-1, -1, 0, 2, 3, 1]},
  {name: 'D#m', label: 'Re#-', frets: [-1, -1, 1, 3, 4, 2]},
  {name: 'Em', label: 'Mi-', frets: [0, 2, 2, 0, 0, 0]},
  {name: 'Fm', label: 'Fa-', frets: [1, 3, 3, 1, 1, 1]},
  {name: 'F#m', label: 'Fa#-', frets: [2, 4, 4, 2, 2, 2]},
  {name: 'Gm', label: 'Sol-', frets: [3, 5, 5, 3, 3, 3]},
  {name: 'G#m', label: 'Sol#-', frets: [4, 6, 6, 4, 4, 4]},
  {name: 'Am', label: 'La-', frets: [-1, 0, 2, 2, 1, 0]},
  {name: 'A#m', label: 'La#-', frets: [-1, 1, 3, 3, 2, 1]},
  {name: 'Bm', label: 'Si-', frets: [-1, 2, 4, 4, 3, 2]},
];

const SETIMA: ChordData[] = [
  {name: 'C7', label: 'Do7', frets: [-1, 3, 2, 3, 1, 0]},
  {name: 'C#7', label: 'Do#7', frets: [-1, 4, 6, 4, 6, 4]},
  {name: 'D7', label: 'Re7', frets: [-1, -1, 0, 2, 1, 2]},
  {name: 'D#7', label: 'Re#7', frets: [-1, -1, 1, 3, 2, 3]},
  {name: 'E7', label: 'Mi7', frets: [0, 2, 0, 1, 0, 0]},
  {name: 'F7', label: 'Fa7', frets: [1, 3, 1, 2, 1, 1]},
  {name: 'F#7', label: 'Fa#7', frets: [2, 4, 2, 3, 2, 2]},
  {name: 'G7', label: 'Sol7', frets: [3, 2, 0, 0, 0, 1]},
  {name: 'G#7', label: 'Sol#7', frets: [4, 6, 4, 5, 4, 4]},
  {name: 'A7', label: 'La7', frets: [-1, 0, 2, 0, 2, 0]},
  {name: 'A#7', label: 'La#7', frets: [-1, 1, 3, 1, 3, 1]},
  {name: 'B7', label: 'Si7', frets: [-1, 2, 1, 2, 0, 2]},
];

const SETIMA_MENOR: ChordData[] = [
  {name: 'Cm7', label: 'Do-7', frets: [-1, 3, 5, 3, 4, 3]},
  {name: 'C#m7', label: 'Do#-7', frets: [-1, 4, 6, 4, 5, 4]},
  {name: 'Dm7', label: 'Re-7', frets: [-1, -1, 0, 2, 1, 1]},
  {name: 'D#m7', label: 'Re#-7', frets: [-1, -1, 1, 3, 2, 2]},
  {name: 'Em7', label: 'Mi-7', frets: [0, 2, 0, 0, 0, 0]},
  {name: 'Fm7', label: 'Fa-7', frets: [1, 3, 1, 1, 1, 1]},
  {name: 'F#m7', label: 'Fa#-7', frets: [2, 4, 2, 2, 2, 2]},
  {name: 'Gm7', label: 'Sol-7', frets: [3, 5, 3, 3, 3, 3]},
  {name: 'G#m7', label: 'Sol#-7', frets: [4, 6, 4, 4, 4, 4]},
  {name: 'Am7', label: 'La-7', frets: [-1, 0, 2, 0, 1, 0]},
  {name: 'A#m7', label: 'La#-7', frets: [-1, 1, 3, 1, 2, 1]},
  {name: 'Bm7', label: 'Si-7', frets: [-1, 2, 4, 2, 3, 2]},
];

const QUINTA: ChordData[] = [
  {name: 'C5', label: 'Do5', frets: [-1, 3, 5, 5, -1, -1]},
  {name: 'C#5', label: 'Do#5', frets: [-1, 4, 6, 6, -1, -1]},
  {name: 'D5', label: 'Re5', frets: [-1, -1, 0, 2, 3, -1]},
  {name: 'D#5', label: 'Re#5', frets: [-1, -1, 1, 3, 4, -1]},
  {name: 'E5', label: 'Mi5', frets: [0, 2, 2, -1, -1, -1]},
  {name: 'F5', label: 'Fa5', frets: [1, 3, 3, -1, -1, -1]},
  {name: 'F#5', label: 'Fa#5', frets: [2, 4, 4, -1, -1, -1]},
  {name: 'G5', label: 'Sol5', frets: [3, 5, 5, -1, -1, -1]},
  {name: 'G#5', label: 'Sol#5', frets: [4, 6, 6, -1, -1, -1]},
  {name: 'A5', label: 'La5', frets: [-1, 0, 2, 2, -1, -1]},
  {name: 'A#5', label: 'La#5', frets: [-1, 1, 3, 3, -1, -1]},
  {name: 'B5', label: 'Si5', frets: [-1, 2, 4, 4, -1, -1]},
];

const QUINTA_MENOR: ChordData[] = [
  {name: 'C5-', label: 'Do5-', frets: [-1, 3, 5, 5, 4, -1]},
  {name: 'C#5-', label: 'Do#5-', frets: [-1, 4, 6, 6, 5, -1]},
  {name: 'D5-', label: 'Re5-', frets: [-1, -1, 0, 2, 3, 1]},
  {name: 'D#5-', label: 'Re#5-', frets: [-1, -1, 1, 3, 4, 2]},
  {name: 'E5-', label: 'Mi5-', frets: [0, 2, 2, 0, 0, 0]},
  {name: 'F5-', label: 'Fa5-', frets: [1, 3, 3, 1, 1, 1]},
  {name: 'F#5-', label: 'Fa#5-', frets: [2, 4, 4, 2, 2, 2]},
  {name: 'G5-', label: 'Sol5-', frets: [3, 5, 5, 3, 3, 3]},
  {name: 'G#5-', label: 'Sol#5-', frets: [4, 6, 6, 4, 4, 4]},
  {name: 'A5-', label: 'La5-', frets: [-1, 0, 2, 2, 1, 0]},
  {name: 'A#5-', label: 'La#5-', frets: [-1, 1, 3, 3, 2, 1]},
  {name: 'B5-', label: 'Si5-', frets: [-1, 2, 4, 4, 3, 2]},
];

const SEXTA: ChordData[] = [
  {name: 'C6', label: 'Do6', frets: [-1, 3, 2, 2, 1, 0]},
  {name: 'C#6', label: 'Do#6', frets: [-1, 4, 3, 3, 2, 1]},
  {name: 'D6', label: 'Re6', frets: [-1, -1, 0, 2, 0, 2]},
  {name: 'D#6', label: 'Re#6', frets: [-1, -1, 1, 3, 1, 3]},
  {name: 'E6', label: 'Mi6', frets: [0, 2, 2, 1, 2, 0]},
  {name: 'F6', label: 'Fa6', frets: [1, -1, 3, 2, 3, 1]},
  {name: 'F#6', label: 'Fa#6', frets: [2, -1, 4, 3, 4, 2]},
  {name: 'G6', label: 'Sol6', frets: [3, 2, 0, 0, 0, 0]},
  {name: 'G#6', label: 'Sol#6', frets: [4, 3, 1, 1, 1, 1]},
  {name: 'A6', label: 'La6', frets: [-1, 0, 2, 2, 2, 2]},
  {name: 'A#6', label: 'La#6', frets: [-1, 1, 3, 3, 3, 3]},
  {name: 'B6', label: 'Si6', frets: [-1, 2, 1, 2, 0, 2]},
];

const SEXTA_MENOR: ChordData[] = [
  {name: 'Cm6', label: 'Do-6', frets: [-1, 3, 1, 2, 1, 3]},
  {name: 'C#m6', label: 'Do#-6', frets: [-1, 4, 2, 3, 2, 4]},
  {name: 'Dm6', label: 'Re-6', frets: [-1, -1, 0, 2, 0, 1]},
  {name: 'D#m6', label: 'Re#-6', frets: [-1, -1, 1, 3, 1, 2]},
  {name: 'Em6', label: 'Mi-6', frets: [0, 2, 2, 0, 2, 0]},
  {name: 'Fm6', label: 'Fa-6', frets: [1, 3, -1, 1, 1, 1]},
  {name: 'F#m6', label: 'Fa#-6', frets: [2, 4, -1, 2, 2, 2]},
  {name: 'Gm6', label: 'Sol-6', frets: [3, 5, -1, 3, 3, 3]},
  {name: 'G#m6', label: 'Sol#-6', frets: [4, 6, -1, 4, 4, 4]},
  {name: 'Am6', label: 'La-6', frets: [-1, 0, 2, 2, 1, 2]},
  {name: 'A#m6', label: 'La#-6', frets: [-1, 1, 3, 3, 2, 3]},
  {name: 'Bm6', label: 'Si-6', frets: [-1, 2, 0, 2, 0, 2]},
];

const NOVENA: ChordData[] = [
  {name: 'C9', label: 'Do9', frets: [-1, 3, 2, 3, 3, 3]},
  {name: 'C#9', label: 'Do#9', frets: [-1, 4, 3, 4, 4, 4]},
  {name: 'D9', label: 'Re9', frets: [-1, -1, 0, 2, 1, 0]},
  {name: 'D#9', label: 'Re#9', frets: [-1, -1, 1, 3, 2, 1]},
  {name: 'E9', label: 'Mi9', frets: [0, 2, 0, 1, 0, 2]},
  {name: 'F9', label: 'Fa9', frets: [1, -1, 1, 2, 1, 3]},
  {name: 'F#9', label: 'Fa#9', frets: [2, -1, 2, 3, 2, 4]},
  {name: 'G9', label: 'Sol9', frets: [3, 2, 0, 0, 0, 1]},
  {name: 'G#9', label: 'Sol#9', frets: [4, 3, 1, 1, 1, 2]},
  {name: 'A9', label: 'La9', frets: [-1, 0, 2, 0, 2, 0]},
  {name: 'A#9', label: 'La#9', frets: [-1, 1, 3, 1, 3, 1]},
  {name: 'B9', label: 'Si9', frets: [-1, 2, 1, 2, 2, 2]},
];

const NOVENA_MENOR: ChordData[] = [
  {name: 'Cm9', label: 'Do-9', frets: [-1, 3, 1, 3, 3, 3]},
  {name: 'C#m9', label: 'Do#-9', frets: [-1, 4, 2, 4, 4, 4]},
  {name: 'Dm9', label: 'Re-9', frets: [-1, -1, 0, 2, 1, 3]},
  {name: 'D#m9', label: 'Re#-9', frets: [-1, -1, 1, 3, 2, 4]},
  {name: 'Em9', label: 'Mi-9', frets: [0, 2, 0, 0, 0, 2]},
  {name: 'Fm9', label: 'Fa-9', frets: [1, 3, 1, 1, 1, 3]},
  {name: 'F#m9', label: 'Fa#-9', frets: [2, 4, 2, 2, 2, 4]},
  {name: 'Gm9', label: 'Sol-9', frets: [3, 5, 3, 3, 3, 5]},
  {name: 'G#m9', label: 'Sol#-9', frets: [4, 6, 4, 4, 4, 6]},
  {name: 'Am9', label: 'La-9', frets: [-1, 0, 2, 0, 1, 0]},
  {name: 'A#m9', label: 'La#-9', frets: [-1, 1, 3, 1, 2, 1]},
  {name: 'Bm9', label: 'Si-9', frets: [-1, 2, 0, 2, 0, 4]},
];

export const GUITAR_CHORD_GROUPS: ChordGroup[] = [
  {title: 'Mayores', chords: MAYORES},
  {title: 'Menores', chords: MENORES},
  {title: '7', chords: SETIMA},
  {title: '7m', chords: SETIMA_MENOR},
  {title: '5', chords: QUINTA},
  {title: '5m', chords: QUINTA_MENOR},
  {title: '6', chords: SEXTA},
  {title: '6m', chords: SEXTA_MENOR},
  {title: '9', chords: NOVENA},
  {title: '9m', chords: NOVENA_MENOR},
];
