/**
 * capoStorage.ts - Persistencia de sugerencias de capo por canción
 *
 * Permite guardar configuraciones de capo personalizadas para cada canción.
 * Cada sugerencia contiene: nombre, semitonos de transporte y posición de capo.
 *
 * Estructura en AsyncStorage:
 * {
 *   "nombre cancion normalizado": [
 *     { name: "Versión grave", offset: -2, capo: 3 },
 *     { name: "Versión aguda", offset: 1, capo: 0 }
 *   ]
 * }
 *
 * Clave de AsyncStorage: 'saved_capo_suggestions'
 *
 * Ejemplo de uso:
 * - Guardar que "Alabaré" suena mejor con capo en traste 3 transportando -2 semitonos
 * - Recordar diferentes configuraciones para distintos cantantes
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {normalize} from './textUtils';

/** Clave de AsyncStorage */
const STORAGE_KEY = 'saved_capo_suggestions';

/** Representa una sugerencia de capo guardada por el usuario */
export interface CapoSuggestion {
  name: string;    // Nombre descriptivo (ej: "Versión grave", "Para soprano")
  offset: number;  // Semitonos de transporte (positivo = subir, negativo = bajar)
  capo: number;    // Posición del capo en trastes (0 = sin capo)
}

/**
 * Carga las sugerencias de capo guardadas para una canción.
 *
 * @param songName - Nombre de la canción (se normaliza automáticamente)
 * @returns Array de sugerencias (vacío si no hay ninguna)
 */
export async function loadCapoSuggestions(songName: string): Promise<CapoSuggestion[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const store = JSON.parse(json) as Record<string, CapoSuggestion[]>;
      return store[normalize(songName)] || [];
    }
  } catch {}
  return [];
}

/**
 * Guarda una nueva sugerencia de capo para una canción.
 * Agrega al final del array de sugerencias existentes.
 *
 * @param songName - Nombre de la canción
 * @param suggestion - Sugerencia a guardar
 */
export async function saveCapoSuggestion(
  songName: string,
  suggestion: CapoSuggestion,
): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    const store = json ? (JSON.parse(json) as Record<string, CapoSuggestion[]>) : {};
    const key = normalize(songName);
    if (!store[key]) {
      store[key] = [];
    }
    store[key].push(suggestion);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

/**
 * Elimina una sugerencia de capo por índice.
 * Si era la última sugerencia de esa canción, elimina la entrada completa.
 *
 * @param songName - Nombre de la canción
 * @param index - Índice de la sugerencia a eliminar en el array
 */
export async function removeCapoSuggestion(
  songName: string,
  index: number,
): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const store = JSON.parse(json) as Record<string, CapoSuggestion[]>;
      const key = normalize(songName);
      if (store[key]) {
        store[key].splice(index, 1);
        if (store[key].length === 0) {
          delete store[key];
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      }
    }
  } catch {}
}
