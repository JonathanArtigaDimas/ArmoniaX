import AsyncStorage from '@react-native-async-storage/async-storage';
import {normalize} from './textUtils';

const STORAGE_KEY = 'saved_capo_suggestions';

export interface CapoSuggestion {
  name: string;
  offset: number;
  capo: number;
}

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
