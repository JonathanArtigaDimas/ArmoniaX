/**
 * songs.ts - Definición de tipos y datos de cantos del himnario
 *
 * Contiene:
 * - Tipo FolderInfo: información de carpetas de usuario
 * - Tipo SongInfo: información de cada canto (nombre, número, páginas PDF)
 * - Array SONGS: lista completa de ~300 cantos generada desde songMapping
 *
 * El array SONGS se genera automáticamente al importar SONG_MAPPING
 * que fue creado por scripts/generateSongMapping.js escaneando el PDF.
 */
import {SONG_MAPPING} from './songMapping';

/** Información de una carpeta creada por el usuario */
export type FolderInfo = {
  id: string;         // ID único generado con Date.now + random
  name: string;       // Nombre de la carpeta (ej: "Adoración")
  createdAt: number;  // Timestamp de creación en milisegundos
};

/** Información completa de un canto del himnario */
export type SongInfo = {
  name: string;           // Nombre del canto (ej: "Alabaré")
  cantoNumber: number;    // Número del canto en el himnario (ej: 123)
  pages: number[];        // Páginas del PDF donde aparece (ej: [45, 46])
  folderId?: string;      // ID de la carpeta donde está archivado (opcional)
};

/**
 * Array maestro de todos los cantos del himnario iResucito.
 * Se genera desde SONG_MAPPING que mapea nombre → {cantoNumber, pages}.
 * Usado por SongsListScreen, FolderScreen y chordProData.
 */
export const SONGS: SongInfo[] = Object.entries(SONG_MAPPING).map(([name, data]) => ({
  name,
  cantoNumber: data.cantoNumber,
  pages: data.pages,
}));
