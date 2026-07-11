export interface ChordData {
  name: string;
  label: string;
  frets: number[];
}

export interface ChordGroup {
  title: string;
  chords: ChordData[];
}
