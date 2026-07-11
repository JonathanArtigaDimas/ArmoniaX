import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Note, getNoteName} from '../constants/instruments';
import {COLORS, FONTS} from '../constants/theme';
import {getCentsColor} from '../utils/tunerUtils';

interface NoteDisplayProps {
  note: Note;
  isTuned?: boolean;
  detectedHz?: number;
  cents?: number;
  tolerance?: number;
  notationSystem?: 'spanish' | 'english';
}

const getTuningStatus = (cents: number, isTuned?: boolean): string => {
  if (isTuned) {return 'afinado';}
  if (cents < 0) {return 'tensar';}
  return 'destensar';
};

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
