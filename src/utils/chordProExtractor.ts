/**
 * chordProExtractor.ts - Extracción y caché de datos ChordPro desde PDF
 *
 * Este módulo maneja la extracción de acordes en formato ChordPro
 * desde el PDF del himnario usando el módulo nativo PDFScanner.
 *
 * Flujo:
 * 1. PDFScanner extrae líneas alineadas (letra + posiciones de acordes)
 * 2. buildChordProFromAligned() las convierte a formato ChordPro
 * 3. Se guarda en AsyncStorage para persistencia
 * 4. Se mantiene un caché en memoria (extractedCache) para acceso rápido
 *
 * La extracción se realiza en segundo plano cuando el usuario
 * selecciona una canción que no tiene ChordPro precompilado.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChordProAlignedLine, extractChordProAligned} from './PDFScanner';
import {normalize} from './textUtils';

/** Clave de AsyncStorage para el caché de ChordPro extraído */
const STORAGE_KEY = 'extracted_chord_pros';

/**
 * Caché en memoria de ChordPro extraídos.
 * Clave: nombre normalizado de la canción
 * Valor: texto en formato ChordPro
 * Se carga al inicio de la app (loadAllExtractedChordPros)
 */
export const extractedCache: Record<string, string> = {};

/**
 * Convierte líneas alineadas del PDF a formato ChordPro.
 *
 * Formato de salida:
 * {title: Nombre de la canción}
 *
 * [Am]Letra de la canción
 * [Re][Sol]Otra línea con acordes
 * Letra sin acordes
 *
 * @param lines - Líneas alineadas del PDF (letra + posiciones de acordes)
 * @param title - Título de la canción (opcional)
 * @returns Texto en formato ChordPro
 */
export function buildChordProFromAligned(
  lines: ChordProAlignedLine[],
  title?: string,
): string {
  const parts: string[] = [];

  if (title) {
    parts.push(`{title: ${title}}`);
    parts.push('');
  }

  for (const line of lines) {
    const {lyricText, chordPositions} = line;

    if (chordPositions.length === 0) {
      parts.push(lyricText);
      continue;
    }

    const sorted = [...chordPositions].sort((a, b) => a.position - b.position);

    const chordChars: string[] = new Array(lyricText.length).fill('');
    for (const cp of sorted) {
      const pos = Math.min(cp.position, lyricText.length);
      for (let i = 0; i < cp.chord.length && pos + i < chordChars.length; i++) {
        chordChars[pos + i] = cp.chord[i];
      }
    }

    const chordLine = chordChars.join('').trimEnd();
    if (chordLine.length > 0) {
      parts.push(chordLine);
    }
    parts.push(lyricText);
  }

  return parts.join('\n');
}

/**
 * Extrae y construye ChordPro desde páginas del PDF.
 * Orquesta: extracción nativa → construcción ChordPro.
 *
 * @param pages - Números de página a extraer
 * @param title - Título de la canción (opcional)
 * @returns Texto en formato ChordPro
 */
export async function extractAndBuildChordPro(
  pages: number[],
  title?: string,
): Promise<string> {
  const aligned = await extractChordProAligned(pages);
  return buildChordProFromAligned(aligned, title);
}

/**
 * Guarda un ChordPro extraído en AsyncStorage y en el caché de memoria.
 * Si el texto está vacío, elimina la entrada.
 *
 * @param songName - Nombre de la canción
 * @param text - Texto en formato ChordPro
 */
export async function saveExtractedChordPro(
  songName: string,
  text: string,
): Promise<void> {
  try {
    const key = normalize(songName);
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    const data = json ? (JSON.parse(json) as Record<string, string>) : {};
    if (text.trim().length === 0) {
      delete data[key];
    } else {
      data[key] = text;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (text.trim().length === 0) {
      delete extractedCache[key];
    } else {
      extractedCache[key] = text;
    }
  } catch {}
}

/**
 * Carga el ChordPro extraído de una canción.
 * Prioridad: caché de memoria > AsyncStorage
 *
 * @param songName - Nombre de la canción
 * @returns Texto ChordPro o null si no existe
 */
export async function loadExtractedChordPro(
  songName: string,
): Promise<string | null> {
  const key = normalize(songName);
  if (extractedCache[key]) {
    return extractedCache[key];
  }
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const data = JSON.parse(json) as Record<string, string>;
      return data[key] ?? null;
    }
  } catch {}
  return null;
}

/**
 * Elimina el ChordPro extraído de una canción.
 * Borra tanto de AsyncStorage como del caché de memoria.
 */
export async function removeExtractedChordPro(
  songName: string,
): Promise<void> {
  const key = normalize(songName);
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const data = JSON.parse(json) as Record<string, string>;
      delete data[key];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    delete extractedCache[key];
  } catch {}
}

/**
 * Carga todos los ChordPro extraídos del AsyncStorage al caché de memoria.
 * Se ejecuta al inicio de la app (App.tsx) para tener datos disponibles rápido.
 */
export async function loadAllExtractedChordPros(): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const data = JSON.parse(json) as Record<string, string>;
      Object.assign(extractedCache, data);
    }
  } catch {}
}
