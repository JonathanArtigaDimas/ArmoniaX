/**
 * VocalRangeScreen.tsx - Detector de rango vocal y tipo de voz
 *
 * Pantalla que permite al usuario seleccionar su rango vocal
 * (nota más baja y nota más alta) y detecta automáticamente
 * su tipo de voz (Tenor, Soprano, etc.).
 *
 * Funcionalidades:
 * - Selector de género (Hombre / Mujer)
 * - Selector de nota inferior con nota + octava
 * - Selector de nota superior con nota + octava
 * - Visualización del rango: "Tu voz: Do3 -> Fa5 +2 oct"
 * - Clasificación automática del tipo de voz
 * - Persistencia de preferencias con AsyncStorage
 *
 * Clasificación de voces:
 * Hombre:
 *   - Bajo: Mi2 a Mi4
 *   - Barítono: Sol2 a Sol4
 *   - Tenor: Do3 a Do5
 *   - Contratenor: Mi3 a Mi5
 * Mujer:
 *   - Contralto: Fa3 a Fa5
 *   - Mezzosoprano: La3 a La5
 *   - Soprano: Do4 a Do6
 */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {COLORS, SPACING} from '../constants/theme';
import {ESCALA} from '../utils/chordTransposer';
import {loadVocalRange, saveVocalRange, VocalRangeData} from '../utils/vocalStorage';

/** Opciones de notas para el selector */
const NOTE_OPTIONS = ESCALA.map((name, index) => ({name, index}));

/** Opciones de octava */
const OCTAVE_OPTIONS = [2, 3, 4, 5, 6];

/** Definición de tipo de voz */
interface VoiceType {
  name: string;
  gender: 'hombre' | 'mujer';
  /** Nota más baja (octava * 12 + índice nota) */
  lowerMidi: number;
  /** Nota más alta (octava * 12 + índice nota) */
  upperMidi: number;
}

/** Tipos de voz con sus rangos en MIDI */
const VOICE_TYPES: VoiceType[] = [
  // Hombres
  {name: 'Bajo', gender: 'hombre', lowerMidi: 2 * 12 + 4, upperMidi: 4 * 12 + 4},       // Mi2 a Mi4
  {name: 'Barítono', gender: 'hombre', lowerMidi: 2 * 12 + 7, upperMidi: 4 * 12 + 7},   // Sol2 a Sol4
  {name: 'Tenor', gender: 'hombre', lowerMidi: 3 * 12 + 0, upperMidi: 5 * 12 + 0},       // Do3 a Do5
  {name: 'Contratenor', gender: 'hombre', lowerMidi: 3 * 12 + 4, upperMidi: 5 * 12 + 4}, // Mi3 a Mi5
  // Mujeres
  {name: 'Contralto', gender: 'mujer', lowerMidi: 3 * 12 + 5, upperMidi: 5 * 12 + 5},   // Fa3 a Fa5
  {name: 'Mezzosoprano', gender: 'mujer', lowerMidi: 3 * 12 + 9, upperMidi: 5 * 12 + 9}, // La3 a La5
  {name: 'Soprano', gender: 'mujer', lowerMidi: 4 * 12 + 0, upperMidi: 6 * 12 + 0},      // Do4 a Do6
];

/**
 * Convierte nota + octava a valor MIDI simplificado.
 * Se usa para comparar rangos.
 */
function toMidi(noteIndex: number, octave: number): number {
  return octave * 12 + noteIndex;
}

/**
 * Calcula la cantidad de octavas entre dos notas.
 */
function octavesBetween(_lowerNote: number, lowerOctave: number, _upperNote: number, upperOctave: number): number {
  return Math.max(0, upperOctave - lowerOctave);
}

/**
 * Clasifica el tipo de voz basado en el rango seleccionado.
 * Busca el tipo de voz cuyo rango contenga o se aproxime más al rango del usuario.
 */
function classifyVoiceType(
  gender: 'hombre' | 'mujer',
  lowerNote: number,
  lowerOctave: number,
  upperNote: number,
  upperOctave: number,
): string {
  const userLower = toMidi(lowerNote, lowerOctave);
  const userUpper = toMidi(upperNote, upperOctave);
  const userRange = userUpper - userLower;

  const candidates = VOICE_TYPES.filter(v => v.gender === gender);

  if (candidates.length === 0) return 'Desconocido';

  // Buscar el tipo de voz cuyo rango contenga mejor al del usuario
  let bestMatch = candidates[0];
  let bestScore = Infinity;

  for (const voice of candidates) {
    const voiceRange = voice.upperMidi - voice.lowerMidi;
    // Cuánto del rango del usuario está dentro del rango de la voz
    const overlapLower = Math.max(userLower, voice.lowerMidi);
    const overlapUpper = Math.min(userUpper, voice.upperMidi);
    const overlap = Math.max(0, overlapUpper - overlapLower);
    // Score: menos overlap = peor match
    const score = userRange - overlap;

    if (score < bestScore) {
      bestScore = score;
      bestMatch = voice;
    }
  }

  return bestMatch.name;
}

interface VocalRangeScreenProps {
  onClose: () => void;
}

/**
 * Pantalla de detector de rango vocal.
 * Permite al usuario seleccionar su rango y detecta su tipo de voz.
 */
export const VocalRangeScreen: React.FC<VocalRangeScreenProps> = ({onClose}) => {
  const [gender, setGender] = useState<'hombre' | 'mujer'>('hombre');
  const [lowerNote, setLowerNote] = useState(0);
  const [lowerOctave, setLowerOctave] = useState(3);
  const [upperNote, setUpperNote] = useState(0);
  const [upperOctave, setUpperOctave] = useState(5);
  const [preferenceOffset, setPreferenceOffset] = useState(0);
  const [showLowerPicker, setShowLowerPicker] = useState(false);
  const [showUpperPicker, setShowUpperPicker] = useState(false);

  useEffect(() => {
    loadVocalRange().then(data => {
      setGender(data.gender);
      setLowerNote(data.lowerNote);
      setLowerOctave(data.lowerOctave);
      setUpperNote(data.upperNote);
      setUpperOctave(data.upperOctave);
      setPreferenceOffset(data.preferenceOffset);
    });
  }, []);

  const handleSave = useCallback(async () => {
    const lowerMidi = toMidi(lowerNote, lowerOctave);
    const upperMidi = toMidi(upperNote, upperOctave);

    if (lowerMidi >= upperMidi) {
      Alert.alert('Rango inválido', 'La nota inferior debe ser menor que la nota superior.');
      return;
    }

    await saveVocalRange({
      gender,
      lowerNote,
      lowerOctave,
      upperNote,
      upperOctave,
      preferenceOffset,
    });
    Alert.alert('Guardado', 'Tu rango vocal ha sido guardado.', [{text: 'OK'}]);
  }, [gender, lowerNote, lowerOctave, upperNote, upperOctave, preferenceOffset]);

  const voiceType = classifyVoiceType(gender, lowerNote, lowerOctave, upperNote, upperOctave);
  const octaves = octavesBetween(lowerNote, lowerOctave, upperNote, upperOctave);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rango Vocal</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Visualización del rango */}
        <View style={styles.rangeDisplay}>
          <Text style={styles.rangeLabel}>Tu voz</Text>
          <View style={styles.rangeRow}>
            <Text style={styles.rangeNote}>
              {ESCALA[lowerNote]}{lowerOctave}
            </Text>
            <Text style={styles.rangeArrow}>→</Text>
            <Text style={styles.rangeNote}>
              {ESCALA[upperNote]}{upperOctave}
            </Text>
            <Text style={styles.rangeOctaves}>+{octaves} oct</Text>
          </View>
        </View>

        {/* Resultado del tipo de voz */}
        <View style={styles.voiceTypeContainer}>
          <Text style={styles.voiceTypeLabel}>Tipo de voz</Text>
          <Text style={styles.voiceTypeValue}>{voiceType}</Text>
        </View>

        {/* Selector de género */}
        <Text style={styles.sectionTitle}>Género</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'hombre' && styles.genderButtonActive]}
            onPress={() => setGender('hombre')}>
            <Text style={[styles.genderButtonText, gender === 'hombre' && styles.genderButtonTextActive]}>
              Hombre
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'mujer' && styles.genderButtonActive]}
            onPress={() => setGender('mujer')}>
            <Text style={[styles.genderButtonText, gender === 'mujer' && styles.genderButtonTextActive]}>
              Mujer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selector de nota inferior */}
        <Text style={styles.sectionTitle}>Nota más baja</Text>
        <TouchableOpacity
          style={styles.noteSelector}
          onPress={() => {
            setShowLowerPicker(!showLowerPicker);
            setShowUpperPicker(false);
          }}>
          <Text style={styles.noteSelectorText}>
            {ESCALA[lowerNote]}{lowerOctave}
          </Text>
          <Text style={styles.noteSelectorArrow}>
            {showLowerPicker ? '▴' : '▾'}
          </Text>
        </TouchableOpacity>
        {showLowerPicker && (
          <View style={styles.pickerContainer}>
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>Nota</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                {NOTE_OPTIONS.map(note => (
                  <TouchableOpacity
                    key={note.index}
                    style={[styles.pickerItem, lowerNote === note.index && styles.pickerItemActive]}
                    onPress={() => setLowerNote(note.index)}>
                    <Text style={[styles.pickerItemText, lowerNote === note.index && styles.pickerItemTextActive]}>
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
                    style={[styles.pickerItem, lowerOctave === oct && styles.pickerItemActive]}
                    onPress={() => setLowerOctave(oct)}>
                    <Text style={[styles.pickerItemText, lowerOctave === oct && styles.pickerItemTextActive]}>
                      {oct}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Selector de nota superior */}
        <Text style={styles.sectionTitle}>Nota más alta</Text>
        <TouchableOpacity
          style={styles.noteSelector}
          onPress={() => {
            setShowUpperPicker(!showUpperPicker);
            setShowLowerPicker(false);
          }}>
          <Text style={styles.noteSelectorText}>
            {ESCALA[upperNote]}{upperOctave}
          </Text>
          <Text style={styles.noteSelectorArrow}>
            {showUpperPicker ? '▴' : '▾'}
          </Text>
        </TouchableOpacity>
        {showUpperPicker && (
          <View style={styles.pickerContainer}>
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>Nota</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                {NOTE_OPTIONS.map(note => (
                  <TouchableOpacity
                    key={note.index}
                    style={[styles.pickerItem, upperNote === note.index && styles.pickerItemActive]}
                    onPress={() => setUpperNote(note.index)}>
                    <Text style={[styles.pickerItemText, upperNote === note.index && styles.pickerItemTextActive]}>
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
                    style={[styles.pickerItem, upperOctave === oct && styles.pickerItemActive]}
                    onPress={() => setUpperOctave(oct)}>
                    <Text style={[styles.pickerItemText, upperOctave === oct && styles.pickerItemTextActive]}>
                      {oct}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Ajuste de preferencia */}
        <Text style={styles.sectionTitle}>Preferencia de tono</Text>
        <View style={styles.preferenceContainer}>
          <Text style={styles.preferenceDescription}>
            Ajusta las recomendaciones vocales. Si sientes que te recomienda tonos muy altos, baja el ajuste.
          </Text>
          <View style={styles.preferenceRow}>
            <TouchableOpacity
              style={styles.preferenceButton}
              onPress={() => setPreferenceOffset(prev => Math.max(prev - 1, -8))}>
              <Text style={styles.preferenceButtonText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.preferenceValueContainer}
              onPress={() => setPreferenceOffset(0)}>
              <Text style={styles.preferenceValue}>
                {preferenceOffset === 0 ? '0' : `${preferenceOffset > 0 ? '+' : ''}${preferenceOffset}`}
              </Text>
              <Text style={styles.preferenceUnit}>semitonos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.preferenceButton}
              onPress={() => setPreferenceOffset(prev => Math.min(prev + 1, 8))}>
              <Text style={styles.preferenceButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.preferenceLabels}>
            <Text style={styles.preferenceLabelText}>Más graves</Text>
            <Text style={styles.preferenceLabelText}>Más agudas</Text>
          </View>
          {preferenceOffset !== 0 && (
            <Text style={styles.preferenceHint}>
              {preferenceOffset > 0 ? 'Recomendará tonos más altos' : 'Recomendará tonos más bajos'} · Toca el número para resetear
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  rangeDisplay: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rangeLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeNote: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: '700',
  },
  rangeArrow: {
    color: COLORS.textSecondary,
    fontSize: 24,
  },
  rangeOctaves: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  voiceTypeContainer: {
    backgroundColor: COLORS.accentDark,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  voiceTypeLabel: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  voiceTypeValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  genderButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genderButtonActive: {
    backgroundColor: COLORS.accentDark,
    borderColor: COLORS.accent,
  },
  genderButtonText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: COLORS.accent,
  },
  noteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  noteSelectorText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  noteSelectorArrow: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  pickerLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    width: 50,
  },
  pickerScroll: {
    flex: 1,
  },
  pickerRowItems: {
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerItemActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  pickerItemText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  pickerItemTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  preferenceContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  preferenceDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  preferenceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  preferenceButtonText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  preferenceValueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  preferenceValue: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: '700',
  },
  preferenceUnit: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  preferenceHint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.6,
  },
  preferenceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  preferenceLabelText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    opacity: 0.5,
  },
});
