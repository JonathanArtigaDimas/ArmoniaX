import React, {useState} from 'react';
import {View, Text, ScrollView, Switch, TouchableOpacity, Modal, FlatList, StyleSheet} from 'react-native';
import {COLORS} from '../constants/theme';
import {BackupScreen} from './BackupScreen';
import {useSettings} from '../contexts/SettingsContext';

const HZ_OPTIONS = Array.from({length: 52}, (_, i) => i + 415);

const NOTATION_OPTIONS = [
  {value: 'spanish' as const, label: 'Español'},
  {value: 'english' as const, label: 'Inglés'},
];

export const ConfiguracionScreen: React.FC = () => {
  const {
    proPrecision,
    setProPrecision,
    referenceHz,
    setReferenceHz,
    notationSystem,
    setNotationSystem,
  } = useSettings();
  const [showHzModal, setShowHzModal] = useState(false);
  const [showNotationModal, setShowNotationModal] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  const handleSelectHz = (hz: number) => {
    setReferenceHz(hz);
    setShowHzModal(false);
  };

  const handleSelectNotation = (value: 'spanish' | 'english') => {
    setNotationSystem(value);
    setShowNotationModal(false);
  };

  const currentNotationLabel = NOTATION_OPTIONS.find(o => o.value === notationSystem)?.label || 'Español';

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
});
