import AsyncStorage from '@react-native-async-storage/async-storage';
import {SongInfo, FolderInfo} from '../data/songs';

const SONGS_KEY = 'custom_songs';
const FOLDERS_KEY = 'custom_folders';
const MIGRATION_KEY = 'songs_v2_migrated';

type LegacySongInfo = {
  name: string;
  cantoNumber: number;
  page?: number;
  pages?: number[];
};

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

export async function removeCustomSong(cantoNumber: number): Promise<void> {
  const songs = await loadCustomSongs();
  const filtered = songs.filter(s => s.cantoNumber !== cantoNumber);
  await AsyncStorage.setItem(SONGS_KEY, JSON.stringify(filtered));
}

export async function loadFolders(): Promise<FolderInfo[]> {
  try {
    const json = await AsyncStorage.getItem(FOLDERS_KEY);
    if (json) {
      return JSON.parse(json) as FolderInfo[];
    }
  } catch {}
  return [];
}

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

export async function deleteFolderAndSongs(folderId: string): Promise<void> {
  const folders = await loadFolders();
  const updatedFolders = folders.filter(f => f.id !== folderId);
  await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));

  const songs = await loadCustomSongs();
  const updatedSongs = songs.filter(s => s.folderId !== folderId);
  await AsyncStorage.setItem(SONGS_KEY, JSON.stringify(updatedSongs));
}
