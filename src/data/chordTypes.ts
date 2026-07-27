/**
 * chordTypes.ts - Interfaces para datos de acordes
 *
 * Define los tipos de datos usados por la biblioteca de acordes
 * (ChordLibraryScreen) y los diagramas de acordes (ChordDiagram).
 */

/** Representa un acorde individual con su diagrama de cuerdas */
export interface ChordData {
  name: string;    // Nombre interno del acorde (ej: "C", "Am", "G7")
  label: string;   // Nombre para mostrar en la UI (ej: "Do", "La-", "Sol7")
  frets: number[]; // Posiciones de trastes por cuerda: -1=muteada, 0=abierta, 1-5=traste
                   // Array de 6 elementos para guitarra, 5 para charango
}

/** Grupo de acordes categorizados (ej: "Mayores", "Menores", "Séptimas") */
export interface ChordGroup {
  title: string;       // Nombre del grupo para mostrar (ej: "Mayores")
  chords: ChordData[]; // Acordes que pertenecen a este grupo
}
