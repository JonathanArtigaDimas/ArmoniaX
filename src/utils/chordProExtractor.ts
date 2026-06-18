import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChordProAlignedLine, extractChordProAligned} from './PDFScanner';

const STORAGE_KEY = 'extracted_chord_pros';

export const extractedCache: Record<string, string> = {};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

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

export async function extractAndBuildChordPro(
  pages: number[],
  title?: string,
): Promise<string> {
  const aligned = await extractChordProAligned(pages);
  return buildChordProFromAligned(aligned, title);
}

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

export async function hasExtractedChordPro(
  songName: string,
): Promise<boolean> {
  const key = normalize(songName);
  if (extractedCache[key]) {
    return true;
  }
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const data = JSON.parse(json) as Record<string, string>;
      return !!data[key];
    }
  } catch {}
  return false;
}

export async function loadAllExtractedChordPros(): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const data = JSON.parse(json) as Record<string, string>;
      Object.assign(extractedCache, data);
    }
  } catch {}
}
