/**
 * MelodyEditorModal.tsx - Editor de datos de melodía de un canto
 *
 * Permite al usuario corregir/definir el rango melódico de un canto
 * (nota grave, nota aguda, tónica) para mejorar el veredicto de la
 * Recomendación Vocal. Los datos se guardan como override en AsyncStorage
 * y tienen prioridad sobre los datos estáticos de melodyData.ts.
 *
 * Accesible siempre desde el modal de Recomendación Vocal (sin modo dev).
 */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import {COLORS, SPACING} from '../constants/theme';
import {ESCALA} from '../utils/chordTransposer';
import {SongMelodyData} from '../utils/melodyTypes';
import {saveMelodyOverride, removeMelodyOverride} from '../utils/melodyStorage';
import {suggestFamilyByRange} from '../utils/melodyAnalyzer';

const NOTE_OPTIONS = ESCALA.map((name, index) => ({name, index}));
const OCTAVE_OPTIONS = [2, 3, 4, 5, 6];
const KEY_OPTIONS = ESCALA.map((name, index) => ({name, index}));

interface NoteField {
  note: number;
  octave: number;
}

function toMidi(note: number, octave: number): number {
  return octave * 12 + note;
}

interface Props {
  visible: boolean;
  cantoName: string;
  originalKey: number;
  initial?: SongMelodyData | null;
  onClose: () => void;
  onSaved: (data: SongMelodyData) => void;
}

const MelodyEditorModal: React.FC<Props> = ({
  visible,
  cantoName,
  originalKey,
  initial,
  onClose,
  onSaved,
}) => {
  const [low, setLow] = useState<NoteField>({note: 9, octave: 3});
  const [high, setHigh] = useState<NoteField>({note: 7, octave: 4});
  const [key, setKey] = useState(originalKey);
  const [showLowPicker, setShowLowPicker] = useState(false);
  const [showHighPicker, setShowHighPicker] = useState(false);
  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const [hasOverride, setHasOverride] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setLow({note: initial.low % 12, octave: Math.floor(initial.low / 12)});
      setHigh({note: initial.high % 12, octave: Math.floor(initial.high / 12)});
      setKey(initial.originalKey);
      setHasOverride(true);
    } else {
      setLow({note: originalKey, octave: 3});
      setHigh({note: (originalKey + 7) % 12, octave: 4});
      setKey(originalKey);
      setHasOverride(false);
    }
    setShowLowPicker(false);
    setShowHighPicker(false);
    setShowKeyPicker(false);
  }, [visible, initial, originalKey]);

  const handleSave = async () => {
    const lowMidi = toMidi(low.note, low.octave);
    const highMidi = toMidi(high.note, high.octave);
    const sortedLow = Math.min(lowMidi, highMidi);
    const sortedHigh = Math.max(lowMidi, highMidi);
    const data: SongMelodyData = {
      originalKey: key,
      low: sortedLow,
      high: sortedHigh,
      tessitura: Math.round((sortedLow + sortedHigh) / 2),
      familyId: suggestFamilyByRange({originalKey: key, low: sortedLow, high: sortedHigh}),
      comment: 'Editado manualmente desde la app',
    };
    await saveMelodyOverride(cantoName, data);
    setHasOverride(true);
    onSaved(data);
  };

  const handleRemove = async () => {
    await removeMelodyOverride(cantoName);
    setHasOverride(false);
    onClose();
  };

  const lowMidi = toMidi(low.note, low.octave);
  const highMidi = toMidi(high.note, high.octave);
  const effectiveLow = Math.min(lowMidi, highMidi);
  const effectiveHigh = Math.max(lowMidi, highMidi);
  const rangeText = `${ESCALA[effectiveLow % 12]}${Math.floor(effectiveLow / 12)} → ${ESCALA[effectiveHigh % 12]}${Math.floor(effectiveHigh / 12)}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.title}>Datos de melodía</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{cantoName}</Text>
            </View>
            <View style={{width: 40}} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Rango melódico */}
            <View style={styles.rangeDisplay}>
              <Text style={styles.rangeLabel}>Rango melódico</Text>
              <Text style={styles.rangeValue}>{rangeText}</Text>
              <Text style={styles.rangeHint}>
                Nota más grave y más aguda que se canta en este canto
              </Text>
            </View>

            {/* Nota grave */}
            <Text style={styles.sectionTitle}>Nota más grave</Text>
            <TouchableOpacity
              style={styles.noteSelector}
              onPress={() => {
                setShowLowPicker(!showLowPicker);
                setShowHighPicker(false);
                setShowKeyPicker(false);
              }}>
              <Text style={styles.noteSelectorText}>{ESCALA[low.note]}{low.octave}</Text>
              <Text style={styles.noteSelectorArrow}>{showLowPicker ? '▴' : '▾'}</Text>
            </TouchableOpacity>
            {showLowPicker && (
              <View style={styles.pickerContainer}>
                <View style={styles.pickerRow}>
                  <Text style={styles.pickerLabel}>Nota</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                    {NOTE_OPTIONS.map(note => (
                      <TouchableOpacity
                        key={note.index}
                        style={[styles.pickerItem, low.note === note.index && styles.pickerItemActive]}
                        onPress={() => setLow(prev => ({...prev, note: note.index}))}>
                        <Text style={[styles.pickerItemText, low.note === note.index && styles.pickerItemTextActive]}>
                          {note.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.pickerRow}>
                  <Text style={styles.pickerLabel}>Octava</Text>
                  <View style={styles.pickerRowItems}>
                    {OCTAVE_OPTIONS.map(oct => (
                      <TouchableOpacity
                        key={oct}
                        style={[styles.pickerItem, low.octave === oct && styles.pickerItemActive]}
                        onPress={() => setLow(prev => ({...prev, octave: oct}))}>
                        <Text style={[styles.pickerItemText, low.octave === oct && styles.pickerItemTextActive]}>
                          {oct}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Nota aguda */}
            <Text style={styles.sectionTitle}>Nota más aguda</Text>
            <TouchableOpacity
              style={styles.noteSelector}
              onPress={() => {
                setShowHighPicker(!showHighPicker);
                setShowLowPicker(false);
                setShowKeyPicker(false);
              }}>
              <Text style={styles.noteSelectorText}>{ESCALA[high.note]}{high.octave}</Text>
              <Text style={styles.noteSelectorArrow}>{showHighPicker ? '▴' : '▾'}</Text>
            </TouchableOpacity>
            {showHighPicker && (
              <View style={styles.pickerContainer}>
                <View style={styles.pickerRow}>
                  <Text style={styles.pickerLabel}>Nota</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                    {NOTE_OPTIONS.map(note => (
                      <TouchableOpacity
                        key={note.index}
                        style={[styles.pickerItem, high.note === note.index && styles.pickerItemActive]}
                        onPress={() => setHigh(prev => ({...prev, note: note.index}))}>
                        <Text style={[styles.pickerItemText, high.note === note.index && styles.pickerItemTextActive]}>
                          {note.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.pickerRow}>
                  <Text style={styles.pickerLabel}>Octava</Text>
                  <View style={styles.pickerRowItems}>
                    {OCTAVE_OPTIONS.map(oct => (
                      <TouchableOpacity
                        key={oct}
                        style={[styles.pickerItem, high.octave === oct && styles.pickerItemActive]}
                        onPress={() => setHigh(prev => ({...prev, octave: oct}))}>
                        <Text style={[styles.pickerItemText, high.octave === oct && styles.pickerItemTextActive]}>
                          {oct}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Tonalidad original */}
            <Text style={styles.sectionTitle}>Tonalidad original</Text>
            <TouchableOpacity
              style={styles.noteSelector}
              onPress={() => {
                setShowKeyPicker(!showKeyPicker);
                setShowLowPicker(false);
                setShowHighPicker(false);
              }}>
              <Text style={styles.noteSelectorText}>{ESCALA[key]}</Text>
              <Text style={styles.noteSelectorArrow}>{showKeyPicker ? '▴' : '▾'}</Text>
            </TouchableOpacity>
            {showKeyPicker && (
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                  {KEY_OPTIONS.map(k => (
                    <TouchableOpacity
                      key={k.index}
                      style={[styles.pickerItem, key === k.index && styles.pickerItemActive]}
                      onPress={() => setKey(k.index)}>
                      <Text style={[styles.pickerItemText, key === k.index && styles.pickerItemTextActive]}>
                        {k.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.modalHint}>
              {hasOverride
                ? 'Este canto tiene datos de melodía personalizados.'
                : 'Si no conoces las notas, déjalo así o corrígelo cuando lo sepas.'}
            </Text>

            {/* Botones */}
            <TouchableOpacity style={styles.saveButton} activeOpacity={0.7} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Guardar datos</Text>
            </TouchableOpacity>
            {hasOverride && (
              <TouchableOpacity style={styles.removeButton} activeOpacity={0.7} onPress={handleRemove}>
                <Text style={styles.removeButtonText}>Restablecer valores por defecto</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  rangeDisplay: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  rangeLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.xs,
  },
  rangeValue: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: '700',
  },
  rangeHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  noteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  noteSelectorText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  noteSelectorArrow: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  pickerRow: {
    marginBottom: SPACING.sm,
  },
  pickerLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  pickerScroll: {
    flexGrow: 0,
  },
  pickerRowItems: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
  },
  pickerItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    marginHorizontal: 3,
  },
  pickerItemActive: {
    backgroundColor: COLORS.surfaceActive,
  },
  pickerItemText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: COLORS.accent,
  },
  modalHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  removeButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  removeButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MelodyEditorModal;