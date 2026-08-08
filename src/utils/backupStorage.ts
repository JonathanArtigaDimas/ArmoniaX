/**
 * backupStorage.ts - Exportación e importación de copias de seguridad
 *
 * Permite respaldar y restaurar toda la data de la app:
 * - Cantos personalizados y carpetas
 * - Notas por canto
 * - ChordPro extraídos desde PDF
 * - Configuración (precisión, Hz de referencia, notación)
 * - Sugerencias de capo
 *
 * Formato del archivo de backup:
 * {
 *   version: 1,
 *   appName: "ArmoniaX",
 *   exportedAt: "2026-07-18T12:00:00.000Z",
 *   data: { "clave": "valor", ... }
 * }
 *
 * Exportación: crea un JSON y usa el sheet de compartir nativo
 * Importación: permite seleccionar un archivo JSON y reemplaza todos los datos
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {pick, keepLocalCopy, types} from '@react-native-documents/picker';
import {loadAllExtractedChordPros} from './chordProExtractor';

/**
 * Lista de claves de AsyncStorage que se incluyen en el backup.
 * Si se agrega una nueva clave de configuración, agregarla aquí.
 */
const BACKUP_KEYS = [
  'custom_songs',
  'custom_folders',
  'song_notes',
  'extracted_chord_pros',
  '@armoniax_pro_precision',
  '@armoniax_reference_hz',
  '@armoniax_notation_system',
  '@armoniax_developer_mode',
  'songs_v2_migrated',
  'saved_capo_suggestions',
  'vocal_range',
  'vocal_offsets_per_song',
  'melody_data_overrides',
];

/** Estructura del archivo de backup JSON */
type BackupData = {
  version: number;                    // Versión del formato (para futuras migraciones)
  appName: string;                    // Nombre de la app (para validar que es de ArmoniaX)
  exportedAt: string;                 // ISO timestamp de cuándo se exportó
  data: Record<string, string | null>; // Clave → valor de AsyncStorage
};

/**
 * Exporta todos los datos de la app como un archivo JSON compartible.
 *
 * Flujo:
 * 1. Lee todas las claves de AsyncStorage
 * 2. Crea el objeto BackupData con metadatos
 * 3. Serializa a JSON formateado
 * 4. Escribe en el caché de la app
 * 5. Abre el sheet de compartir nativo (Share)
 *
 * El usuario puede guardar el archivo o enviarlo por WhatsApp/email.
 * Nombre del archivo: armoniax_backup_YYYY-MM-DD.json
 */
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

/**
 * Importa un archivo de backup JSON y reemplaza todos los datos de la app.
 *
 * Flujo:
 * 1. Abre el picker de documentos (solo archivos .json)
 * 2. Copia el archivo al caché local
 * 3. Lee y parsea el JSON
 * 4. Valida que sea un backup de ArmoniaX
 * 5. Reemplaza cada clave en AsyncStorage
 * 6. Muestra resultado al usuario
 *
 * @returns Objeto con éxito/mensaje para mostrar al usuario
 */
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

    // Recargar caché de ChordPro en memoria
    await loadAllExtractedChordPros();

    return {success: true, message: 'Copia restaurada exitosamente'};
  } catch (error: any) {
    return {success: false, message: error?.message || 'Error al restaurar'};
  }
}
