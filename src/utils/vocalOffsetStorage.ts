/**
 * vocalOffsetStorage.ts - Persistencia de offset vocal por canto
 *
 * Guarda el offset de transporte que el usuario usó para cada canto
 * en la función de Recomendación Vocal. La próxima vez que abra
 * el mismo canto, se cargará el offset guardado como punto de partida.
 *
 * Estructura en AsyncStorage:
 * {
 *   "numero_canto": -2,
 *   "otro_numero_canto": 3
 * }
 *
 * Clave de AsyncStorage: 'vocal_offsets_per_song'
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Clave de AsyncStorage */
const STORAGE_KEY = 'vocal_offsets_per_song';

/**
 * Carga el offset vocal guardado para un canto.
 *
 * @param cantoNumber - Número del canto en el himnario
 * @returns Offset guardado en semitonos, o null si no hay guardado
 */
export async function loadVocalOffset(cantoNumber: number): Promise<number | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const store = JSON.parse(json) as Record<string, number>;
      const key = String(cantoNumber);
      if (key in store) {
        return store[key];
      }
    }
  } catch {}
  return null;
}

/**
 * Guarda el offset vocal usado para un canto.
 *
 * @param cantoNumber - Número del canto
 * @param offset - Offset en semitonos que el usuario aplicó
 */
export async function saveVocalOffset(cantoNumber: number, offset: number): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    const store = json ? (JSON.parse(json) as Record<string, number>) : {};
    store[String(cantoNumber)] = offset;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

/**
 * Elimina el offset vocal guardado para un canto.
 *
 * @param cantoNumber - Número del canto
 */
export async function removeVocalOffset(cantoNumber: number): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const store = JSON.parse(json) as Record<string, number>;
      delete store[String(cantoNumber)];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  } catch {}
}
