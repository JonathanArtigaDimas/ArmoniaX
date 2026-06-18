import {NativeModules} from 'react-native';

export interface PDFScanResult {
  titulo: string;
  numeroCanto: string;
  pagina: string;
}

interface PDFScanResponse {
  status: 'success' | 'not_found';
  results?: PDFScanResult[];
}

const {PDFScanner} = NativeModules;

export async function buscarCantoEnPDF(nombreCanto: string): Promise<PDFScanResponse> {
  if (!PDFScanner) {
    throw new Error('PDFScannerModule no está disponible. Verifica la configuración nativa.');
  }

  try {
    const result: PDFScanResponse = await PDFScanner.buscarCantoEnPDF(nombreCanto);
    return result;
  } catch (error) {
    throw error;
  }
}

export async function extractPageText(pages: number[]): Promise<string> {
  if (!PDFScanner) {
    throw new Error('PDFScannerModule no está disponible. Verifica la configuración nativa.');
  }

  try {
    const result: string = await PDFScanner.extractPageText(pages);
    return result;
  } catch (error) {
    throw error;
  }
}

export interface FormattedLine {
  chordText: string;
  lyricText: string;
}

export async function extractFormattedText(pages: number[]): Promise<FormattedLine[]> {
  if (!PDFScanner) {
    throw new Error('PDFScannerModule no está disponible. Verifica la configuración nativa.');
  }

  try {
    const result: FormattedLine[] = await PDFScanner.extractFormattedText(pages);
    return result;
  } catch (error) {
    throw error;
  }
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
  if (!PDFScanner) {
    throw new Error('PDFScannerModule no está disponible. Verifica la configuración nativa.');
  }

  try {
    const result: ChordProAlignedLine[] = await PDFScanner.extractChordProAligned(pages);
    return result;
  } catch (error) {
    throw error;
  }
}
