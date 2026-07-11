import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'song_notes';

export async function loadNote(cantoNumber: number): Promise<string> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const notes = JSON.parse(json) as Record<string, string>;
      return notes[String(cantoNumber)] || '';
    }
  } catch {}
  return '';
}

export async function saveNote(cantoNumber: number, text: string): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    const notes = json ? JSON.parse(json) as Record<string, string> : {};
    if (text.trim().length === 0) {
      delete notes[String(cantoNumber)];
    } else {
      notes[String(cantoNumber)] = text;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

export async function removeNote(cantoNumber: number): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const notes = JSON.parse(json) as Record<string, string>;
      delete notes[String(cantoNumber)];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  } catch {}
}
