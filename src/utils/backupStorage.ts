import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {pick, keepLocalCopy, types} from '@react-native-documents/picker';

const BACKUP_KEYS = [
  'custom_songs',
  'custom_folders',
  'song_notes',
  'extracted_chord_pros',
  '@armoniax_pro_precision',
  '@armoniax_reference_hz',
  '@armoniax_notation_system',
  'songs_v2_migrated',
  'saved_capo_suggestions',
];

type BackupData = {
  version: number;
  appName: string;
  exportedAt: string;
  data: Record<string, string | null>;
};

export async function exportBackup(): Promise<void> {
  const data: Record<string, string | null> = {};
  for (const key of BACKUP_KEYS) {
    data[key] = await AsyncStorage.getItem(key);
  }

  const backup: BackupData = {
    version: 1,
    appName: 'ArmoniaX',
    exportedAt: new Date().toISOString(),
    data,
  };

  const json = JSON.stringify(backup, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `armoniax_backup_${date}.json`;
  const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

  await RNFS.writeFile(filePath, json, 'utf8');

  await Share.open({
    url: `file://${filePath}`,
    type: 'application/json',
    filename: fileName,
    failOnCancel: false,
  });
}

export async function importBackup(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const result = await pick({type: [types.json]});

    if (!result || result.length === 0) {
      return {success: false, message: 'Cancelado'};
    }

    const picked = result[0];
    const localCopy = await keepLocalCopy({
      files: [{uri: picked.uri, fileName: picked.name || 'backup.json'}],
      destination: 'cachesDirectory',
    });

    if (localCopy[0].status !== 'success') {
      return {success: false, message: 'No se pudo leer el archivo'};
    }

    const localUri = localCopy[0].localUri;
    const filePath = localUri.startsWith('file://')
      ? localUri.replace('file://', '')
      : localUri;
    const json = await RNFS.readFile(filePath, 'utf8');
    const backup: BackupData = JSON.parse(json);

    if (backup.appName !== 'ArmoniaX' || !backup.data) {
      return {success: false, message: 'Archivo de copia no válido'};
    }

    for (const key of BACKUP_KEYS) {
      const value = backup.data[key];
      if (value !== null && value !== undefined) {
        await AsyncStorage.setItem(key, value);
      } else {
        await AsyncStorage.removeItem(key);
      }
    }

    return {success: true, message: 'Copia restaurada exitosamente'};
  } catch (error: any) {
    return {success: false, message: error?.message || 'Error al restaurar'};
  }
}
