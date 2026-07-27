/**
 * vocalStorage.ts - Persistencia de preferencias de rango vocal
 *
 * Guarda y carga la configuración del rango vocal del usuario:
 * - Género (hombre/mujer)
 * - Nota inferior (índice 0-11 en ESCALA)
 * - Octava de la nota inferior
 * - Nota superior (índice 0-11 en ESCALA)
 * - Octava de la nota superior
 *
 * Clave de AsyncStorage: 'vocal_range'
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Clave de AsyncStorage para el rango vocal */
const STORAGE_KEY = 'vocal_range';

/** Datos del rango vocal del usuario */
export interface VocalRangeData {
  gender: 'hombre' | 'mujer';
  lowerNote: number;   // índice 0-11 en ESCALA
  lowerOctave: number; // octava de la nota inferior (2-5)
  upperNote: number;   // índice 0-11 en ESCALA
  upperOctave: number; // octava de la nota superior (2-6)
}

/** Datos por defecto: hombre, Do3 a Do5 */
const DEFAULT_DATA: VocalRangeData = {
  gender: 'hombre',
  lowerNote: 0,  // DO
  lowerOctave: 3,
  upperNote: 0,  // DO
  upperOctave: 5,
};

/**
 * Carga las preferencias de rango vocal del usuario.
 * Si no hay datos guardados, retorna los valores por defecto.
 */
export async function loadVocalRange(): Promise<VocalRangeData> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const data = JSON.parse(json) as Partial<VocalRangeData>;
      return {
        gender: data.gender ?? DEFAULT_DATA.gender,
        lowerNote: data.lowerNote ?? DEFAULT_DATA.lowerNote,
        lowerOctave: data.lowerOctave ?? DEFAULT_DATA.lowerOctave,
        upperNote: data.upperNote ?? DEFAULT_DATA.upperNote,
        upperOctave: data.upperOctave ?? DEFAULT_DATA.upperOctave,
      };
    }
  } catch {}
  return DEFAULT_DATA;
}

/**
 * Guarda las preferencias de rango vocal del usuario.
 */
export async function saveVocalRange(data: VocalRangeData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}
