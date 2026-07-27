/**
 * noteStorage.ts - Persistencia de notas personales por canto
 *
 * Permite a los usuario guardar notas personales asociadas a cada canto.
 * Las notas se almacenan en AsyncStorage como un objeto JSON:
 * { "123": "nota del canto 123", "456": "nota del canto 456" }
 *
 * Clave de AsyncStorage: 'song_notes'
 *
 * Ejemplo de uso:
 * - Guardar notas de ensayo para un canto específico
 * - Recordar indicaciones del director musical
 * - Apuntes personales sobre la canción
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Clave de AsyncStorage para las notas */
const STORAGE_KEY = 'song_notes';

/**
 * Carga la nota personalizada de un canto.
 *
 * @param cantoNumber - Número del canto en el himnario
 * @returns Texto de la nota o cadena vacía si no existe
 */
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

/**
 * Guarda o actualiza la nota de un canto.
 * Si el texto está vacío, elimina la nota del almacenamiento.
 *
 * @param cantoNumber - Número del canto
 * @param text - Texto de la nota
 */
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

/** Elimina la nota de un canto por su número */
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
