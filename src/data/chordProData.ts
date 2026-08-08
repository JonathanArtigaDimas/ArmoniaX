/**
 * chordProData.ts - Lookup de datos ChordPro para canciones
 *
 * Proporciona la función lookupChordPro() que busca el texto ChordPro
 * de una canción por su nombre. Busca en dos fuentes:
 * 1. cancionero.js (datos precompilados por scripts/convertResucito.js)
 * 2. extractedCache (ChordPro extraído desde PDF en tiempo de ejecución)
 *
 * Normaliza los nombres de canción (quita tildes, lowercase) para
 * búsquedas flexibles.
 */
import {extractedCache} from '../utils/chordProExtractor';
import {normalize} from '../utils/textUtils';

/** Caché lazy-loaded del cancionero en memoria */
let _chordProData: Record<string, string> | null = null;

/**
 * Carga perezosa del cancionero.js.
 * Solo se ejecuta la primera vez que se llama.
 * Convierte el array de {name, chordPro} a un mapa normalizado.
 */
function getChordProData(): Record<string, string> {
  if (_chordProData) {
    return _chordProData;
  }
  const DATA: Array<{name: string; chordPro: string}> = require('../../cancionero.js');
  _chordProData = {};
  for (const entry of DATA) {
    _chordProData[normalize(entry.name)] = entry.chordPro;
  }
  return _chordProData;
}

/**
 * Busca el ChordPro de una canción por nombre.
 * Prioridad: extractedCache (ediciones del usuario) > cancionero.js
 *
 * @param songName - Nombre de la canción (se normaliza automáticamente)
 * @returns Texto en formato ChordPro o null si no se encuentra
 */
export function lookupChordPro(songName: string): string | null {
  const key = normalize(songName);

  // Buscar primero en caché de extracción (incluye ediciones del usuario)
  if (extractedCache[key]) {
    return extractedCache[key];
  }

  // Buscar en el cancionero precompilado
  const data = getChordProData();
  if (data[key]) {
    return data[key];
  }

  return null;
}
