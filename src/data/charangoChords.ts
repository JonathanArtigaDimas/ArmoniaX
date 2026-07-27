/**
 * charangoChords.ts - Biblioteca de acordes de charango
 *
 * Contiene los acordes de charango organizados por tipo:
 * Mayores, Menores y Séptimas.
 *
 * Cada acorde define 5 valores (una por cuerda):
 * -1 = cuerda muteada (X), 0 = cuerda abierta (O), 1-7 = número de traste
 *
 * Afinación estándar andina: G C E A E (cuerdas 5→1, grave→agudo)
 * frets[0] = cuerda 5 (Sol grave), frets[4] = cuerda 1 (Mi agudo)
 */
import {ChordData, ChordGroup} from './chordTypes';

// Acordes Mayores de charango
const MAYORES: ChordData[] = [
  {name: 'C', label: 'Do', frets: [0, 0, 0, 3, 0]},
  {name: 'C#', label: 'Do#', frets: [1, 1, 1, 4, 1]},
  {name: 'D', label: 'Re', frets: [2, 2, 2, 0, 2]},
  {name: 'D#', label: 'Re#', frets: [3, 3, 3, 1, 3]},
  {name: 'E', label: 'Mi', frets: [1, 4, 4, 2, 4]},
  {name: 'F', label: 'Fa', frets: [2, 0, 1, 0, 1]},
  {name: 'F#', label: 'Fa#', frets: [3, 1, 2, 1, 2]},
  {name: 'G', label: 'Sol', frets: [4, 2, 3, 2, 3]},
  {name: 'G#', label: 'Sol#', frets: [5, 3, 4, 3, 4]},
  {name: 'A', label: 'La', frets: [2, 1, 0, 0, 0]},
  {name: 'A#', label: 'La#', frets: [3, 2, 1, 1, 1]},
  {name: 'B', label: 'Si', frets: [4, 3, 2, 2, 2]},
];

// Acordes Menores de charango
const MENORES: ChordData[] = [
  {name: 'Cm', label: 'Do-', frets: [0, 3, 3, 3, 3]},
  {name: 'C#m', label: 'Do#-', frets: [1, 1, 0, 4, 0]},
  {name: 'Dm', label: 'Re-', frets: [2, 2, 1, 0, 1]},
  {name: 'D#m', label: 'Re#-', frets: [3, 3, 2, 1, 2]},
  {name: 'Em', label: 'Mi-', frets: [0, 4, 0, 2, 0]},
  {name: 'Fm', label: 'Fa-', frets: [1, 0, 1, 3, 1]},
  {name: 'F#m', label: 'Fa#-', frets: [2, 1, 2, 4, 2]},
  {name: 'Gm', label: 'Sol-', frets: [3, 2, 3, 5, 3]},
  {name: 'G#m', label: 'Sol#-', frets: [4, 3, 4, 6, 4]},
  {name: 'Am', label: 'La-', frets: [2, 0, 0, 0, 0]},
  {name: 'A#m', label: 'La#-', frets: [3, 1, 1, 1, 1]},
  {name: 'Bm', label: 'Si-', frets: [4, 2, 2, 2, 2]},
];

// Séptimas de charango
const SETIMA: ChordData[] = [
  {name: 'C7', label: 'Do7', frets: [0, 0, 0, 1, 0]},
  {name: 'C#7', label: 'Do#7', frets: [1, 1, 1, 2, 1]},
  {name: 'D7', label: 'Re7', frets: [2, 2, 2, 3, 2]},
  {name: 'D#7', label: 'Re#7', frets: [3, 3, 3, 4, 3]},
  {name: 'E7', label: 'Mi7', frets: [1, 2, 0, 2, 0]},
  {name: 'F7', label: 'Fa7', frets: [2, 3, 1, 3, 1]},
  {name: 'F#7', label: 'Fa#7', frets: [3, 1, 0, 1, 2]},
  {name: 'G7', label: 'Sol7', frets: [0, 2, 1, 2, 3]},
  {name: 'G#7', label: 'Sol#7', frets: [0, 3, 2, 3, 4]},
  {name: 'A7', label: 'La7', frets: [0, 1, 0, 0, 0]},
  {name: 'A#7', label: 'La#7', frets: [1, 2, 1, 1, 1]},
  {name: 'B7', label: 'Si7', frets: [2, 3, 2, 2, 2]},
];

/**
 * Array de grupos de acordes de charango.
 * Usado por ChordLibraryScreen cuando se selecciona charango.
 */
export const CHARANGO_CHORD_GROUPS: ChordGroup[] = [
  {title: 'Mayores', chords: MAYORES},
  {title: 'Menores', chords: MENORES},
  {title: '7', chords: SETIMA},
];
