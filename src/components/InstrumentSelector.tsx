/**
 * InstrumentSelector.tsx - Selector horizontal de instrumentos
 *
 * Componente presentacional que muestra un scroll horizontal de chips
 * para seleccionar el instrumento activo (Guitarra o Charango).
 *
 * Cada chip muestra el emoji y nombre del instrumento.
 * El chip seleccionado se resalta con color de acento.
 *
 * Usado en: MainScreen.tsx (pantalla del afinador)
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Instrument} from '../constants/instruments';
import {COLORS} from '../constants/theme';

/** Props del selector de instrumentos */
interface InstrumentSelectorProps {
  instruments: Instrument[];  // Array de instrumentos disponibles
  selectedId: string;         // ID del instrumento actualmente seleccionado
  onSelect: (instrument: Instrument) => void; // Callback al seleccionar
}

/**
 * Selector de instrumento con scroll horizontal.
 * Muestra chips con emoji + nombre para cada instrumento.
 */
export const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({
  instruments,
  selectedId,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Instrumento</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {instruments.map(instrument => {
          const isSelected = instrument.id === selectedId;
          return (
            <TouchableOpacity
              key={instrument.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelect(instrument)}
              activeOpacity={0.7}>
              <Text style={styles.icon}>{instrument.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}>
                {instrument.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  scrollContent: {
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.accent,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.accent,
  },
});
