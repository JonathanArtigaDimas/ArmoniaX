/**
 * songStorage.ts - Persistencia de cantos personalizados y carpetas
 *
 * Maneja el CRUD completo de:
 * - Cantos personalizados (añadidos a carpetas o creados por el usuario)
 * - Carpetas de organización
 *
 * Almacena todo en AsyncStorage con migración automática de formato legacy.
 * Las carpetas se identifican por ID único, los cantos por número de canto.
 *
 * Claves de AsyncStorage:
 * - 'custom_songs': Array de SongInfo serializado
 * - 'custom_folders': Array de FolderInfo serializado
 * - 'songs_v2_migrated': Flag de migración del formato v1
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SongInfo, FolderInfo} from '../data/songs';

/** Clave de AsyncStorage para cantos personalizados */
const SONGS_KEY = 'custom_songs';
/** Clave de AsyncStorage para carpetas */
const FOLDERS_KEY = 'custom_folders';
/** Clave para controlar la migración del formato v1 a v2 */
const MIGRATION_KEY = 'songs_v2_migrated';

/** Formato legacy v1 de SongInfo (tenía 'page' individual en lugar de 'pages' array) */
type LegacySongInfo = {
  name: string;
  cantoNumber: number;
  page?: number;    // Formato v1: página individual
  pages?: number[]; // Formato v2: array de páginas
};

/**
 * Migra un canto del formato legacy (v1) al actual (v2).
 * Convierte 'page' individual a 'pages' array.
 * Agrega 'folderId' si existe.
 */
function migrateSong(song: SongInfo | LegacySongInfo): SongInfo {
  const s = song as LegacySongInfo;
  const folderId =
    'folderId' in song ? (song as SongInfo).folderId : undefined;
  if (s.pages && s.pages.length > 0) {
    return {name: s.name, cantoNumber: s.cantoNumber, pages: s.pages, folderId};
  }
  if (s.page) {
    return {name: s.name, cantoNumber: s.cantoNumber, pages: [s.page], folderId};
  }
  return {name: s.name, cantoNumber: s.cantoNumber, pages: [], folderId};
}

/**
 * Carga todos los cantos personalizados del AsyncStorage.
 * Ejecuta migración automática en la primera carga.
 * Elimina duplicados por número de canto.
 *
 * @returns Array de SongInfo único y migrado
 */
export async function loadCustomSongs(): Promise<SongInfo[]> {
  try {
    const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
    if (!migrated) {
      await AsyncStorage.removeItem(SONGS_KEY);
      await AsyncStorage.setItem(MIGRATION_KEY, 'true');
      return [];
    }
    const json = await AsyncStorage.getItem(SONGS_KEY);
    if (json) {
      const raw = JSON.parse(json) as (SongInfo | LegacySongInfo)[];
      const songs = raw.map(migrateSong);
      const seen = new Set<number>();
      const unique = songs.filter(s => {
        if (seen.has(s.cantoNumber)) return false;
        seen.add(s.cantoNumber);
        return true;
      });
      if (unique.length !== songs.length) {
        await AsyncStorage.setItem(SONGS_KEY, JSON.stringify(unique));
      }
      return unique;
    }
  } catch {}
  return [];
}

/**
 * Guarda o actualiza un canto personalizado.
 * Si ya existe uno con el mismo número, lo reemplaza.
 *
 * @param song - SongInfo a guardar
 */
export async function saveCustomSong(song: SongInfo): Promise<void> {
  const songs = await loadCustomSongs();
  const index = songs.findIndex(s => s.cantoNumber === song.cantoNumber);
  if (index >= 0) {
    songs[index] = song;
  } else {
    songs.push(song);
  }
  await AsyncStorage.setItem(SONGS_KEY, JSON.stringify(songs));
}

/**
 * Elimina un canto personalizado por su número.
 * Usado para quitar cantos de carpetas.
 */
export async function removeCustomSong(cantoNumber: number): Promise<void> {
  const songs = await loadCustomSongs();
  const filtered = songs.filter(s => s.cantoNumber !== cantoNumber);
  await AsyncStorage.setItem(SONGS_KEY, JSON.stringify(filtered));
}

/** Carga todas las carpetas del AsyncStorage */
export async function loadFolders(): Promise<FolderInfo[]> {
  try {
    const json = await AsyncStorage.getItem(FOLDERS_KEY);
    if (json) {
      return JSON.parse(json) as FolderInfo[];
    }
  } catch {}
  return [];
}

/**
 * Crea una nueva carpeta con ID único.
 * El ID se genera con Date.now() + random para garantizar unicidad.
 *
 * @param name - Nombre de la carpeta
 * @returns FolderInfo creada con el ID asignado
 */
export async function createFolder(name: string): Promise<FolderInfo> {
  const folders = await loadFolders();
  const folder: FolderInfo = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name,
    createdAt: Date.now(),
  };
  folders.push(folder);
  await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  return folder;
}

/**
 * Elimina una carpeta por ID.
 * Los cantos que estaban en ella quedan sin folderId (no se eliminan).
 * NOTA: Usar deleteFolderAndSongs() si se quieren eliminar los cantos también.
 */
export async function deleteFolder(folderId: string): Promise<void> {
  const folders = await loadFolders();
  const filtered = folders.filter(f => f.id !== folderId);
  await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(filtered));

  const songs = await loadCustomSongs();
  const updated = songs.map(s =>
    s.folderId === folderId ? {...s, folderId: undefined} : s,
  );
  await AsyncStorage.setItem(SONGS_KEY, JSON.stringify(updated));
}

/** Renombra una carpeta existente */
export async function renameFolder(
  folderId: string,
  newName: string,
): Promise<void> {
  const folders = await loadFolders();
  const updated = folders.map(f =>
    f.id === folderId ? {...f, name: newName} : f,
  );
  await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(updated));
}

/**
 * Elimina una carpeta y todos los cantos que contiene.
 * Esta es la función que se usa para eliminar carpetas desde FolderScreen.
 * Diferencia con deleteFolder(): aquí también se eliminan los cantos.
 */
export async function deleteFolderAndSongs(folderId: string): Promise<void> {
  const folders = await loadFolders();
  const updatedFolders = folders.filter(f => f.id !== folderId);
  await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));

  const songs = await loadCustomSongs();
  const updatedSongs = songs.filter(s => s.folderId !== folderId);
  await AsyncStorage.setItem(SONGS_KEY, JSON.stringify(updatedSongs));
}
