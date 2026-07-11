import {COLORS} from '../constants/theme';

export function centsFromFreq(detected: number, target: number): number {
  const raw = 1200 * Math.log2(detected / target);
  return Math.max(-1000, Math.min(1000, Math.round(raw)));
}

export function getCentsColor(cents: number, isTuned?: boolean, tolerance: number = 10): string {
  if (isTuned) {return '#00FF88';}
  const abs = Math.abs(cents);
  if (abs <= tolerance) {return COLORS.accent;}
  if (abs <= tolerance * 2) {return COLORS.warning;}
  return COLORS.error;
}
