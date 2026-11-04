/**
 * ConfiguracionScreen.tsx - Pantalla de configuración de la app
 *
 * Permite al usuario ajustar las preferencias de la aplicación:
 *
 * Sección General:
 * - Precisión Profesional: reduce tolerancia de 10 a 3 cents
 * - Calibrar: frecuencia de referencia (415-466 Hz)
 * - Sistema de Notación: Español (Do-Re-Mi) o Inglés (C-D-E)
 *
 * Sección Datos:
 * - Copia de seguridad: exportar/importar toda la data como JSON
 *
 * Cada configuración se guarda automáticamente en AsyncStorage
 * via el SettingsContext.
 *
 * Las opciones de Hz y notación se muestran en modales bottom-sheet
 * con FlatList para selección eficiente.
 */
import React, {useState} from 'react';
import {View, Text, ScrollView, Switch, TouchableOpacity, Modal, FlatList, StyleSheet, TextInput} from 'react-native';
import {COLORS} from '../constants/theme';
import {BackupScreen} from './BackupScreen';
import {useSettings} from '../contexts/SettingsContext';
import type {AccidentalPreference} from '../utils/chordTransposer';

/** Opciones de frecuencia de referencia: 415-466 Hz (rango completo) */
const HZ_OPTIONS = Array.from({length: 52}, (_, i) => i + 415);

/** Opciones de sistema de notación */
const NOTATION_OPTIONS = [
  {value: 'spanish' as const, label: 'Español'},
  {value: 'english' as const, label: 'Inglés'},
];

/** Opciones de escritura de sostenidos y bemoles */
const ACCIDENTAL_OPTIONS: Array<{
  value: AccidentalPreference;
  label: string;
  description: string;
}> = [
  {
    value: 'professional',
    label: 'Profesional',
    description:
      'Elige sostenidos o bemoles según la tonalidad y la armonía del canto. Recomendado.',
  },
  {
    value: 'sharp',
    label: 'Sostenidos',
    description:
      'Todas las alteraciones se muestran como sostenidos. Ejemplo: Sib → La#.',
  },
  {
    value: 'flat',
    label: 'Bemoles',
    description:
      'Todas las alteraciones se muestran como bemoles. Ejemplo: Fa# → Solb.',
  },
];

/**
 * Pantalla de configuración de la app.
 * Muestra opciones organizadas en secciones con modales de selección.
 */
export const ConfiguracionScreen: React.FC = () => {
  const {
    proPrecision,
    setProPrecision,
    referenceHz,
    setReferenceHz,
    notationSystem,
    setNotationSystem,
    developerMode,
    setDeveloperMode,
    accidentalPreference,
    setAccidentalPreference,
  } = useSettings();
  const [showHzModal, setShowHzModal] = useState(false);
  const [showNotationModal, setShowNotationModal] = useState(false);
  const [showAccidentalModal, setShowAccidentalModal] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [devCode, setDevCode] = useState('');

  const handleSelectHz = (hz: number) => {
    setReferenceHz(hz);
    setShowHzModal(false);
  };

  const handleSelectNotation = (value: 'spanish' | 'english') => {
    setNotationSystem(value);
    setShowNotationModal(false);
  };

  const handleSelectAccidental = (value: AccidentalPreference) => {
    setAccidentalPreference(value);
    setShowAccidentalModal(false);
  };

  const currentNotationLabel = NOTATION_OPTIONS.find(o => o.value === notationSystem)?.label || 'Español';
  const currentAccidentalLabel =
    ACCIDENTAL_OPTIONS.find(o => o.value === accidentalPreference)?.label || 'Profesional';

  const handleDevCode = () => {
    if (devCode.trim().toUpperCase() === 'AX2026') {
      setDeveloperMode(true);
      setDevCode('');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      <Text style={styles.screenTitle}>Configuración</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.sectionContent}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Precisión Profesional</Text>
            <Switch
              value={proPrecision}
              onValueChange={setProPrecision}
              trackColor={{false: COLORS.surface, true: COLORS.surfaceActive}}
              thumbColor={proPrecision ? COLORS.accent : COLORS.textSecondary}
              accessibilityLabel="Precisión Profesional"
            />
          </View>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setShowHzModal(true)}
            accessibilityLabel={`Calibrar, frecuencia actual ${referenceHz}Hz`}
            accessibilityRole="button">
            <Text style={styles.rowLabel}>Calibrar</Text>
            <Text style={styles.rowValue}>{referenceHz}Hz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setShowNotationModal(true)}
            accessibilityLabel={`Sistema de Notación, actual ${currentNotationLabel}`}
            accessibilityRole="button">
            <Text style={styles.rowLabel}>Sistema de Notación</Text>
            <Text style={styles.rowValue}>{currentNotationLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setShowAccidentalModal(true)}
            accessibilityLabel={`Preferencias de sostenidos y bemoles, actual ${currentAccidentalLabel}`}
            accessibilityRole="button">
            <Text style={styles.rowLabel}>Preferencias de Sostenidos y Bemoles</Text>
            <Text style={styles.rowValue}>{currentAccidentalLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos</Text>
        <View style={styles.sectionContent}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setShowBackup(true)}
            accessibilityLabel="Copia de seguridad"
            accessibilityRole="button">
            <Text style={styles.rowLabel}>Copia de seguridad</Text>
            <Text style={styles.rowValue}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Para Desarrollador</Text>
        <View style={styles.sectionContent}>
          {developerMode ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Modo Desarrollador</Text>
              <Switch
                value={true}
                onValueChange={setDeveloperMode}
                trackColor={{false: COLORS.surface, true: COLORS.surfaceActive}}
                thumbColor={COLORS.accent}
                accessibilityLabel="Modo Desarrollador"
              />
            </View>
          ) : (
            <View style={styles.row}>
              <TextInput
                style={styles.devCodeInput}
                placeholder="Ingresa código"
                placeholderTextColor={COLORS.textSecondary}
                value={devCode}
                onChangeText={setDevCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity onPress={handleDevCode}>
                <Text style={styles.rowValue}>Activar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={showHzModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHzModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHzModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Frecuencia de Referencia</Text>
              <TouchableOpacity onPress={() => setShowHzModal(false)}>
                <Text style={styles.modalClose}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={HZ_OPTIONS}
              keyExtractor={(item) => item.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.hzItem,
                    item === referenceHz && styles.hzItemSelected,
                  ]}
                  onPress={() => handleSelectHz(item)}>
                  <Text
                    style={[
                      styles.hzItemText,
                      item === referenceHz && styles.hzItemTextSelected,
                    ]}>
                    {item}Hz
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showNotationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotationModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotationModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sistema de Notación</Text>
              <TouchableOpacity onPress={() => setShowNotationModal(false)}>
                <Text style={styles.modalClose}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            {NOTATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.hzItem,
                  option.value === notationSystem && styles.hzItemSelected,
                ]}
                onPress={() => handleSelectNotation(option.value)}>
                <Text
                  style={[
                    styles.hzItemText,
                    option.value === notationSystem && styles.hzItemTextSelected,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showAccidentalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccidentalModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAccidentalModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sostenidos y Bemoles</Text>
              <TouchableOpacity onPress={() => setShowAccidentalModal(false)}>
                <Text style={styles.modalClose}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {ACCIDENTAL_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.spellingOption,
                    option.value === accidentalPreference && styles.hzItemSelected,
                  ]}
                  onPress={() => handleSelectAccidental(option.value)}
                  accessibilityRole="button"
                  accessibilityState={{selected: option.value === accidentalPreference}}>
                  <View style={styles.spellingOptionHeader}>
                    <Text
                      style={[
                        styles.spellingOptionTitle,
                        option.value === accidentalPreference && styles.hzItemTextSelected,
                      ]}>
                      {option.label}
                    </Text>
                    {option.value === accidentalPreference && (
                      <Text style={styles.spellingCheck}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.spellingOptionDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showBackup}
        animationType="slide"
        onRequestClose={() => setShowBackup(false)}>
        <BackupScreen onClose={() => setShowBackup(false)} />
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  sectionContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
    marginRight: 12,
  },
  rowValue: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '500',
  },
  hzItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  hzItemSelected: {
    backgroundColor: COLORS.surfaceActive,
  },
  hzItemText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  hzItemTextSelected: {
    color: COLORS.accent,
  },
  spellingOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  spellingOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  spellingOptionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  spellingOptionDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  spellingCheck: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  devCodeInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
});
