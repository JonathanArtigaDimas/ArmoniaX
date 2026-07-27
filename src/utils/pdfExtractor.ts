/**
 * pdfExtractor.ts - Extracción de páginas del PDF del himnario
 *
 * Este módulo extrae páginas específicas del PDF del himnario iResucito
 * para mostrarlas en el visor de PDF de la app.
 *
 * Flujo:
 * 1. Carga el PDF completo desde los assets de la app
 * 2. Selecciona las páginas solicitadas usando pdf-lib
 * 3. Crea un nuevo PDF solo con esas páginas
 * 4. Guarda el resultado en el caché del sistema
 * 5. Devuelve la ruta del archivo para el visor
 *
 * Optimizaciones:
 * - Caché del PDF fuente en memoria (evita re-leer el asset)
 * - Caché de páginas extraídas en filesystem (evita re-extraer)
 * - Las páginas se ordenan antes de extraer para caché consistente
 */
declare const btoa: (input: string) => string;
declare const atob: (input: string) => string;

import {PDFDocument} from 'pdf-lib';
import ReactNativeBlobUtil from 'react-native-blob-util';

/** Nombre del archivo PDF del himnario en los assets */
const PDF_FILENAME = 'iResucitó-es-US.pdf';

/** Caché del PDF fuente en memoria para evitar releer el asset */
let cachedPdfBytes: Uint8Array | null = null;
/** Instancia del documento PDF fuente para reutilizar */
let cachedSrcDoc: PDFDocument | null = null;

/**
 * Carga los bytes del PDF fuente desde los assets de React Native.
 * Usa ReactNativeBlobUtil para acceder al asset bundled.
 * Convierte de base64 a Uint8Array.
 * Se cachea para no releer en cada llamada.
 */
async function getSrcPdfBytes(): Promise<Uint8Array> {
  if (cachedPdfBytes) {
    return cachedPdfBytes;
  }

  const assetPath = ReactNativeBlobUtil.fs.asset(PDF_FILENAME);
  const pdfBase64 = await ReactNativeBlobUtil.fs.readFile(assetPath, 'base64');

  const binary = atob(pdfBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  cachedPdfBytes = bytes;
  return bytes;
}

/**
 * Obtiene la instancia del documento PDF fuente.
 * Se cachea para reutilizar entre múltiples extracciones.
 */
async function getSrcDoc(): Promise<PDFDocument> {
  if (cachedSrcDoc) {
    return cachedSrcDoc;
  }

  const bytes = await getSrcPdfBytes();
  cachedSrcDoc = await PDFDocument.load(bytes);
  return cachedSrcDoc;
}

/**
 * Pre-carga el PDF en memoria.
 * Llamar al inicio de la app para que la extracción sea instantánea después.
 */
export async function preloadPdf(): Promise<void> {
  await getSrcDoc();
}

/**
 * Extrae una sola página del PDF.
 * Atajo para extractPdfPages([pageNumber]).
 */
export async function extractPdfPage(pageNumber: number): Promise<string> {
  return extractPdfPages([pageNumber]);
}

/**
 * Extrae múltiples páginas del PDF y crea un nuevo archivo.
 *
 * @param pages - Array de números de página (1-indexed)
 * @returns Ruta del archivo PDF temporal con las páginas extraídas
 *
 * @throws Error si alguna página está fuera de rango
 *
 * El resultado se cachea en el filesystem:
 * - Nombre: song_pages_{p1}_{p2}.pdf (páginas ordenadas)
 * - Si ya existe, retorna la ruta sin re-extraer
 *
 * Ejemplo:
 * extractPdfPages([45, 46]) → "/cache/song_pages_45_46.pdf"
 */
export async function extractPdfPages(pages: number[]): Promise<string> {
  const sorted = [...pages].sort((a, b) => a - b);
  const cacheKey = sorted.join('_');
  const cachePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/song_pages_${cacheKey}.pdf`;

  const cacheExists = await ReactNativeBlobUtil.fs.exists(cachePath);
  if (cacheExists) {
    return cachePath;
  }

  const srcDoc = await getSrcDoc();
  const totalPages = srcDoc.getPageCount();

  for (const p of sorted) {
    if (p < 1 || p > totalPages) {
      throw new Error(
        `Página ${p} fuera de rango (1-${totalPages})`,
      );
    }
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(
    srcDoc,
    sorted.map(p => p - 1),
  );
  copiedPages.forEach(page => newDoc.addPage(page));

  const newPdfBytes = await newDoc.save();

  let binary = '';
  for (let i = 0; i < newPdfBytes.length; i++) {
    binary += String.fromCharCode(newPdfBytes[i]);
  }
  const base64String = btoa(binary);

  await ReactNativeBlobUtil.fs.writeFile(cachePath, base64String, 'base64');

  return cachePath;
}
