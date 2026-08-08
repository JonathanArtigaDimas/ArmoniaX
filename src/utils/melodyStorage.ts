/**
 * melodyStorage.ts - Persistencia de datos de melodía personalizados
 *
 * Guarda overrides de SongMelodyData por nombre de canto normalizado.
 * Los overrides tienen prioridad sobre los datos estáticos de melodyData.ts.
 *
 * Estructura en AsyncStorage:
 * {
 *   "a la cena del cordero": { originalKey: 9, low: 45, high: 55, ... },
 *   "es paciente": { originalKey: 9, low: 40, high: 55, ... }
 * }
 *
 * Clave de AsyncStorage: 'melody_data_overrides'
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SongMelodyData } from './melodyTypes';

const STORAGE_KEY = 'melody_data_overrides';

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export async function loadMelodyOverrides(): Promise<Record<string, SongMelodyData>> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      return JSON.parse(json) as Record<string, SongMelodyData>;
    }
  } catch {}
  return {};
}

export async function saveMelodyOverride(name: string, data: SongMelodyData): Promise<void> {
  try {
    const store = await loadMelodyOverrides();
    store[normalizeName(name)] = data;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export async function removeMelodyOverride(name: string): Promise<void> {
  try {
    const store = await loadMelodyOverrides();
    delete store[normalizeName(name)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}