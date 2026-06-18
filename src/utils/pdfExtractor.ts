declare const btoa: (input: string) => string;
declare const atob: (input: string) => string;

import {PDFDocument} from 'pdf-lib';
import ReactNativeBlobUtil from 'react-native-blob-util';

const PDF_FILENAME = 'iResucitó-es-US.pdf';

let cachedPdfBytes: Uint8Array | null = null;
let cachedSrcDoc: PDFDocument | null = null;

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

async function getSrcDoc(): Promise<PDFDocument> {
  if (cachedSrcDoc) {
    return cachedSrcDoc;
  }

  const bytes = await getSrcPdfBytes();
  cachedSrcDoc = await PDFDocument.load(bytes);
  return cachedSrcDoc;
}

export async function preloadPdf(): Promise<void> {
  await getSrcDoc();
}

export async function extractPdfPage(pageNumber: number): Promise<string> {
  return extractPdfPages([pageNumber]);
}

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
