export interface Note {
  name: string;
  frequency: number;
}

const NOTE_MAP: Record<string, string> = {
  'C': 'Do',
  'C#': 'Do#',
  'D': 'Re',
  'D#': 'Re#',
  'E': 'Mi',
  'F': 'Fa',
  'F#': 'Fa#',
  'G': 'Sol',
  'G#': 'Sol#',
  'A': 'La',
  'A#': 'La#',
  'B': 'Si',
};

export function getNoteInSpanish(noteName: string): string {
  const match = noteName.match(/^([A-G]#?)(\d+)$/);
  if (!match) return noteName;
  const [, note, octave] = match;
  return (NOTE_MAP[note] || note) + octave;
}

export function getNoteName(noteName: string, system: 'spanish' | 'english'): string {
  if (system === 'english') return noteName;
  return getNoteInSpanish(noteName);
}

export interface Instrument {
  id: string;
  name: string;
  icon: string;
  notes: Note[];
}

export const INSTRUMENTS: Instrument[] = [
  {
    id: 'guitar',
    name: 'Guitarra',
    icon: '🎸',
    notes: [
      { name: 'E2', frequency: 82.41 },
      { name: 'A2', frequency: 110.0 },
      { name: 'D3', frequency: 146.83 },
      { name: 'G3', frequency: 196.0 },
      { name: 'B3', frequency: 246.94 },
      { name: 'E4', frequency: 329.63 },
    ],
  },
  {
    id: 'charango',
    name: 'Charango',
    icon: '🪕',
    notes: [
      { name: 'E5', frequency: 659.25 },
      { name: 'A4', frequency: 440.0 },
      { name: 'E4', frequency: 329.63 },
      { name: 'C5', frequency: 523.25 },
      { name: 'G4', frequency: 392.0 },
    ],
  },
];
