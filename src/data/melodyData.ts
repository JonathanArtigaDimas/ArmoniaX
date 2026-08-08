import { SongMelodyData } from '../utils/melodyTypes';

export const MELODY_DATA: Record<string, SongMelodyData> = {
  'a la cena del cordero': {
    originalKey: 9,
    low: 40,
    high: 55,
    tessitura: 48,
    familyId: 'licorico_agudos',
    comment: 'Verificado por oído: recitación sostenida entre La3 y Re4, agudo máximo Sol4 en el clímax.',
  },
  'es paciente': {
    originalKey: 9,
    low: 40,
    high: 55,
    tessitura: 45,
    familyId: 'neutros_balanceados',
    comment: 'Verificado por oído: estrofas Mi3-La3, coro y clímax Sol4 (00:04:24).',
  },
  'oh dios, tú eres mi dios': {
    originalKey: 9,
    low: 40,
    high: 55,
    tessitura: 48,
    familyId: 'licorico_agudos',
    comment: 'Verificado por oído: melodía sostenida entre La3 y Do4, agudo máximo Sol4.',
  },
  'a la víctima pascual': {
    originalKey: 4,
    low: 40,
    high: 53,
    tessitura: 45,
    familyId: 'flamencos_frigios',
    comment: 'Verificado por oído: modo frigio (Mi), franja Mi3-Do4 con cadencia flamenca, agudo máximo Fa4.',
  },
  'a nadie demos ocasión de tropiezo': {
    originalKey: 9,
    low: 40,
    high: 55,
    tessitura: 48,
    familyId: 'licorico_agudos',
    comment: 'Verificado por oído: recitación sostenida entre La3 y Re4, agudo máximo Sol4.',
  },
};