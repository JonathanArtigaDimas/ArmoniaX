/**
 * PDFScanner.ts - Bridge al módulo nativo de escaneo de PDFs
 *
 * Este módulo actúa como puente entre JavaScript y los módulos nativos
 * (Kotlin para Android, Swift para iOS) que implementan:
 *
 * 1. buscarCantoEnPDF() - Busca un canto por nombre en el PDF del himnario
 *    y devuelve título, número de canto y página encontrada.
 *
 * 2. extractFormattedText() - Extrae texto formateado (acordes + letra)
 *    de páginas específicas del PDF.
 *
 * 3. extractChordProAligned() - Extrae y alinea acordes con su posición
 *    en la letra, listo para construir formato ChordPro.
 *
 * Los módulos nativos usan librerías de procesamiento de PDF nativas
 * para extraer texto con información de posición (x, y).
 *
 * Si el módulo nativo no está disponible (ej: en desarrollo),
 * las funciones lanzan un error descriptivo.
 */
import {NativeModules} from 'react-native';

/** Módulo nativo PDFScanner registrado en React Native */
const {PDFScanner} = NativeModules;

/** Mensaje de error cuando el módulo nativo no está disponible */
const NOT_AVAILABLE_ERROR = 'PDFScannerModule no está disponible. Verifica la configuración nativa.';

/**
 * Función genérica para llamar métodos del módulo nativo.
 * Verifica que el módulo exista antes de llamar.
 *
 * @param method - Nombre del método nativo a llamar
 * @param args - Argumentos para el método
 * @returns Promesa con el resultado del método nativo
 */
async function callNative<T>(method: string, ...args: any[]): Promise<T> {
  if (!PDFScanner) {
    throw new Error(NOT_AVAILABLE_ERROR);
  }
  return PDFScanner[method](...args);
}

/** Resultado de buscar un canto en el PDF */
export interface PDFScanResult {
  titulo: string;      // Título encontrado en el PDF
  numeroCanto: string; // Número del canto
  pagina: string;      // Página donde se encontró
}

/** Respuesta de la búsqueda de canto en el PDF */
interface PDFScanResponse {
  status: 'success' | 'not_found';
  results?: PDFScanResult[]; // Array de resultados encontrados
}

/**
 * Busca un canto por nombre en el PDF del himnario.
 * Usa el módulo nativo para extraer texto y buscar coincidencias.
 *
 * @param nombreCanto - Nombre del canto a buscar
 * @returns Respuesta con estado y resultados encontrados
 */
export async function buscarCantoEnPDF(nombreCanto: string): Promise<PDFScanResponse> {
  return callNative('buscarCantoEnPDF', nombreCanto);
}

/** Línea de texto formateada extraída del PDF (acorde + letra) */
export interface FormattedLine {
  chordText: string;  // Texto del acorde (puede estar vacío si es solo letra)
  lyricText: string;  // Texto de la letra
}

/**
 * Extrae texto formateado de páginas específicas del PDF.
 * Devuelve pares de acorde + letra para cada línea.
 *
 * @param pages - Array de números de página a extraer
 * @returns Array de líneas formateadas
 */
export async function extractFormattedText(pages: number[]): Promise<FormattedLine[]> {
  return callNative('extractFormattedText', pages);
}

/** Posición de un acorde en la línea de letra */
export interface ChordPosition {
  chord: string;    // Nombre del acorde (ej: "Am", "Do7")
  position: number; // Posición del acorde en la línea de letra (índice de carácter)
}

/** Línea alineada de ChordPro extraída del PDF */
export interface ChordProAlignedLine {
  lyricText: string;           // Texto de la letra de la línea
  chordPositions: ChordPosition[]; // Acordes con sus posiciones en la letra
}

/**
 * Extrae y alinea acordes con la letra de páginas del PDF.
 * El resultado es directamente utilizable por buildChordProFromAligned().
 *
 * @param pages - Array de números de página a extraer
 * @returns Array de líneas alineadas con acordes y letra
 */
export async function extractChordProAligned(pages: number[]): Promise<ChordProAlignedLine[]> {
  return callNative('extractChordProAligned', pages);
}
