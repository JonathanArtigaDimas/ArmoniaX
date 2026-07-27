/**
 * NoteDisplay.tsx - Display de nota musical del afinador
 *
 * Componente que muestra la información principal de la nota detectada:
 * - Frecuencia en Hz (con color según estado)
 * - Nombre de la nota (en español o inglés según configuración)
 * - Estado de afinación ("AFINADO", "TENSAR", "DESTENSAR")
 *
 * El color del estado cambia según la desviación de cents:
 * - Verde brillante: afinado
 * - Verde: dentro de tolerancia
 * - Naranja: cerca pero fuera
 * - Rojo: muy desafinado
 *
 * Usado en: MainScreen.tsx (pantalla del afinador)
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Note, getNoteName} from '../constants/instruments';
import {COLORS, FONTS} from '../constants/theme';
import {getCentsColor} from '../utils/tunerUtils';

/** Props del display de nota */
interface NoteDisplayProps {
  note: Note;                                          // Nota objetivo actual
  isTuned?: boolean;                                   // Si está afinada
  detectedHz?: number;                                 // Frecuencia detectada por micrófono
  cents?: number;                                      // Desviación en cents
  tolerance?: number;                                  // Tolerancia en cents (10 normal, 3 profesional)
  notationSystem?: 'spanish' | 'english';              // Sistema de notación activo
}

/**
 * Determina el texto de estado según la desviación de cents.
 * - cents < 0: "TENSAR" (la cuerda está floja)
 * - cents > 0: "DESTENSAR" (la cuerda está muy tensa)
 * - isTuned: "AFINADO" (está dentro de tolerancia)
 */
const getTuningStatus = (cents: number, isTuned?: boolean): string => {
  if (isTuned) {return 'afinado';}
  if (cents < 0) {return 'tensar';}
  return 'destensar';
};

/**
 * Display principal de nota del afinador.
 * Muestra frecuencia, nombre de nota y estado de afinación.
 */
export const NoteDisplay: React.FC<NoteDisplayProps> = ({
  note,
  isTuned,
  detectedHz,
  cents = 0,
  tolerance = 10,
  notationSystem = 'spanish',
}) => {
  const freqColor = isTuned ? '#00FF88' : COLORS.textSecondary;
  const displayHz = detectedHz && detectedHz > 0 ? detectedHz.toFixed(1) : note.frequency.toFixed(2);
  const status = getTuningStatus(cents, isTuned);
  const statusColor = getCentsColor(cents, isTuned, tolerance);

  return (
    <View style={styles.container}>
      <Text style={[styles.frequency, {color: freqColor}]}>{displayHz} Hz</Text>
      <Text style={[styles.noteName, isTuned && styles.noteNameTuned]}>{getNoteName(note.name, notationSystem)}</Text>
      <Text style={[styles.statusText, {color: statusColor}]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  frequency: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  noteName: {
    ...FONTS.noteLarge,
    color: COLORS.text,
  },
  noteNameTuned: {
    color: '#00FF88',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
