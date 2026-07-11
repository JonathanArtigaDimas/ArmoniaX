import {NativeModules} from 'react-native';

const {PDFScanner} = NativeModules;

const NOT_AVAILABLE_ERROR = 'PDFScannerModule no está disponible. Verifica la configuración nativa.';

async function callNative<T>(method: string, ...args: any[]): Promise<T> {
  if (!PDFScanner) {
    throw new Error(NOT_AVAILABLE_ERROR);
  }
  return PDFScanner[method](...args);
}

export interface PDFScanResult {
  titulo: string;
  numeroCanto: string;
  pagina: string;
}

interface PDFScanResponse {
  status: 'success' | 'not_found';
  results?: PDFScanResult[];
}

export async function buscarCantoEnPDF(nombreCanto: string): Promise<PDFScanResponse> {
  return callNative('buscarCantoEnPDF', nombreCanto);
}

export interface FormattedLine {
  chordText: string;
  lyricText: string;
}

export async function extractFormattedText(pages: number[]): Promise<FormattedLine[]> {
  return callNative('extractFormattedText', pages);
}

export interface ChordPosition {
  chord: string;
  position: number;
}

export interface ChordProAlignedLine {
  lyricText: string;
  chordPositions: ChordPosition[];
}

export async function extractChordProAligned(pages: number[]): Promise<ChordProAlignedLine[]> {
  return callNative('extractChordProAligned', pages);
}
