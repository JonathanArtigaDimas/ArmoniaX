import { SongMelodyData, VocalVerdict, VocalVerdictStatus } from './melodyTypes';
import { loadMelodyOverrides } from './melodyStorage';

let staticMelodyData: Record<string, SongMelodyData> | null = null;

async function getStaticData(): Promise<Record<string, SongMelodyData>> {
  if (!staticMelodyData) {
    const { MELODY_DATA } = await import('../data/melodyData');
    staticMelodyData = MELODY_DATA;
  }
  return staticMelodyData;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export async function lookupMelodyData(name: string): Promise<SongMelodyData | null> {
  const normalized = normalizeName(name);
  const overrides = await loadMelodyOverrides();
  if (overrides[normalized]) {
    return overrides[normalized];
  }
  const staticData = await getStaticData();
  if (staticData[normalized]) {
    return staticData[normalized];
  }
  return null;
}

export function computeRecommendedOffset(
  melody: SongMelodyData,
  vocalRange: { lowerNote: number; lowerOctave: number; upperNote: number; upperOctave: number; preferenceOffset?: number },
  familyAdjustment: number = 0
): number {
  const userLower = vocalRange.lowerOctave * 12 + vocalRange.lowerNote;
  const userUpper = vocalRange.upperOctave * 12 + vocalRange.upperNote;
  const pref = vocalRange.preferenceOffset || 0;

  const melodyLow = melody.low;
  const melodyHigh = melody.high;
  const melodyCenter = melody.tessitura ?? Math.round((melodyLow + melodyHigh) / 2);

  const targetCenter = userLower + Math.round((userUpper - userLower) * 0.4) + pref;
  let offset = targetCenter - melodyCenter;

  const minOffset = userLower - melodyLow;
  const maxOffset = userUpper - melodyHigh;

  if (offset < minOffset) offset = minOffset;
  if (offset > maxOffset) offset = maxOffset;

  offset += familyAdjustment;

  const finalMinOffset = userLower - melodyLow;
  const finalMaxOffset = userUpper - melodyHigh;
  if (offset < finalMinOffset) offset = finalMinOffset;
  if (offset > finalMaxOffset) offset = finalMaxOffset;

  return offset;
}

export function analyzeVocalFit(
  melody: SongMelodyData,
  offset: number,
  vocalRange: { lowerNote: number; lowerOctave: number; upperNote: number; upperOctave: number }
): VocalVerdict {
  const userLower = vocalRange.lowerOctave * 12 + vocalRange.lowerNote;
  const userUpper = vocalRange.upperOctave * 12 + vocalRange.upperNote;

  const transposedLow = melody.low + offset;
  const transposedHigh = melody.high + offset;

  const overlapLow = Math.max(transposedLow, userLower);
  const overlapHigh = Math.min(transposedHigh, userUpper);

  const melodySpan = transposedHigh - transposedLow;
  const overlapSpan = Math.max(0, overlapHigh - overlapLow);
  const fitRatio = melodySpan > 0 ? overlapSpan / melodySpan : 1;

  let status: VocalVerdictStatus;
  let reason: string;

  if (transposedLow >= userLower && transposedHigh <= userUpper) {
    status = 'optimal';
    reason = 'La melodía completa cabe cómodamente en tu rango';
  } else if (fitRatio >= 0.8) {
    status = 'aceptable';
    const parts: string[] = [];
    if (transposedLow < userLower) parts.push(`${userLower - transposedLow} semitonos por debajo`);
    if (transposedHigh > userUpper) parts.push(`${transposedHigh - userUpper} semitonos por encima`);
    reason = `Ligeramente fuera de rango: ${parts.join(' y ')}`;
  } else if (fitRatio >= 0.5) {
    status = 'dificil';
    const parts: string[] = [];
    if (transposedLow < userLower) parts.push(`${userLower - transposedLow} semitonos por debajo`);
    if (transposedHigh > userUpper) parts.push(`${transposedHigh - userUpper} semitonos por encima`);
    reason = `Parcialmente fuera de rango: ${parts.join(' y ')}`;
  } else {
    status = 'fuera';
    reason = 'La melodía queda mayormente fuera de tu rango vocal';
  }

  const score = Math.round(fitRatio * 100);

  return { score, status, reason, offset };
}

export function suggestFamilyByRange(melody: SongMelodyData): string {
  const span = melody.high - melody.low;
  if (span <= 10) return 'neutros_balanceados';
  if (melody.low < 40) return 'recitativos_graves';
  if (melody.high > 60) return 'licorico_agudos';
  if (melody.low >= 40 && melody.high <= 55) return 'festivos_salmos';
  return 'neutros_balanceados';
}