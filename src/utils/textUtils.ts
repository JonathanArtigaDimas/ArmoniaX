/**
 * textUtils.ts - Utilidades de normalización de texto
 *
 * Funciones para normalizar texto usado en búsquedas y claves de almacenamiento.
 * Elimina tildes, convierte a minúsculas y elimina espacios extras.
 *
 * Ejemplo: "Alabaré a Mi Rey" → "alabarar a mi rey"
 *
 * Usado por:
 * - chordProData.ts: para buscar canciones por nombre
 * - capoStorage.ts: para claves de sugerencias de capo
 * - chordProExtractor.ts: para claves de caché de ChordPro
 */

/**
 * Normaliza un texto para búsquedas flexibles.
 * Elimina acentos, convierte a minúsculas y recorta espacios.
 *
 * @param text - Texto a normalizar
 * @returns Texto normalizado (sin tildes, minúsculas, sin espacios extras)
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
