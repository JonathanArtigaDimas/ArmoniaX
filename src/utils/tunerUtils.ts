/**
 * tunerUtils.ts - Utilidades para el afinador
 *
 * Funciones para calcular la desviación de cents de una frecuencia
 * detectada respecto a una frecuencia objetivo, y para mapear
 * esa desviación a un color visual.
 */
import {COLORS} from '../constants/theme';

/**
 * Calcula la desviación en cents entre una frecuencia detectada y un objetivo.
 *
 * Fórmula: cents = 1200 × log₂(frecuencia_detectada / frecuencia_objetivo)
 * - 0 cents = afinado perfectamente
 * - Negativo = la nota está bemol (necesita tensar)
 * - Posativo = la nota está sostenido (necesita destensar)
 *
 * Resultado acotado entre -1000 y +1000 para evitar valores extremos.
 *
 * @param detected - Frecuencia detectada por el micrófono en Hz
 * @param target - Frecuencia de la nota objetivo en Hz
 * @returns Desviación en cents (entero)
 */
export function centsFromFreq(detected: number, target: number): number {
  const raw = 1200 * Math.log2(detected / target);
  return Math.max(-1000, Math.min(1000, Math.round(raw)));
}

/**
 * Devuelve el color correspondiente según la desviación de cents.
 *
 * Lógica de colores:
 * - Si está afinado (isTuned=true): verde brillante #00FF88
 * - Si está dentro de tolerancia: verde acento (COLORS.accent)
 * - Si está hasta 2× tolerancia: naranja advertencia (COLORS.warning)
 * - Si está fuera de rango: rojo error (COLORS.error)
 *
 * @param cents - Desviación en cents
 * @param isTuned - Si la nota está considerada afinada
 * @param tolerance - Tolerancia en cents (10 normal, 3 profesional)
 * @returns Color en formato hexadecimal
 */
export function getCentsColor(cents: number, isTuned?: boolean, tolerance: number = 10): string {
  if (isTuned) {return '#00FF88';}
  const abs = Math.abs(cents);
  if (abs <= tolerance) {return COLORS.accent;}
  if (abs <= tolerance * 2) {return COLORS.warning;}
  return COLORS.error;
}
