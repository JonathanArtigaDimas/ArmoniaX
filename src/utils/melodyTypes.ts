export interface NoteRange {
  low: number;
  high: number;
}

export interface SongMelodyData {
  originalKey: number;
  low: number;
  high: number;
  tessitura?: number;
  familyId?: string;
  comment?: string;
}

export type VocalVerdictStatus = 'optimal' | 'aceptable' | 'dificil' | 'fuera';

export interface VocalVerdict {
  score: number;
  status: VocalVerdictStatus;
  reason: string;
  offset: number;
}