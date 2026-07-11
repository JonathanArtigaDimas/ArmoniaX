import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {COLORS} from '../constants/theme';
import {
  parseAcorde,
  transportarAcorde,
  formatearAcorde,
  FACIL_MAYOR,
  FACIL_MENOR,
  FACIL_7,
  FACIL_M7,
  FACIL_5,
  FACIL_M5,
  FACIL_6,
  FACIL_M6,
  FACIL_9,
  FACIL_M9,
  MEDIO_MAYOR,
  MEDIO_MENOR,
} from '../utils/chordTransposer';

const NOTAS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

type Modificador = {
  label: string;
  sufijo: string;
  esMenor: boolean;
};

const MOD_PRINCIPALES: Modificador[] = [
  {label: 'Mayor', sufijo: '', esMenor: false},
  {label: 'Menor', sufijo: '-', esMenor: true},
  {label: '7', sufijo: '7', esMenor: false},
  {label: '7m', sufijo: '7', esMenor: true},
];

const MOD_EXTRA: Modificador[] = [
  {label: '5', sufijo: '5', esMenor: false},
  {label: '5m', sufijo: '5-', esMenor: true},
  {label: '6', sufijo: '6', esMenor: false},
  {label: '6m', sufijo: '6-', esMenor: true},
  {label: '9', sufijo: '9', esMenor: false},
  {label: '9m', sufijo: '9-', esMenor: true},
];

interface TransposerScreenProps {
  onClose: () => void;
}

interface CapoResult {
  capo: number;
  acordesFaciles: string[];
  acordesOriginales: string[];
  dificultad: number[];
}

function calcularDificultad(indice: number, esMenor: boolean, sufijo: string): number {
  if (sufijo === '7' || sufijo === '-7') {
    return esMenor
      ? (FACIL_M7.includes(indice) ? 0 : 2)
      : (FACIL_7.includes(indice) ? 0 : 2);
  }
  if (sufijo === '5' || sufijo === '-5') {
    return esMenor
      ? (FACIL_M5.includes(indice) ? 0 : 1)
      : (FACIL_5.includes(indice) ? 0 : 1);
  }
  if (sufijo === '6' || sufijo === '-6') {
    return esMenor
      ? (FACIL_M6.includes(indice) ? 0 : 2)
      : (FACIL_6.includes(indice) ? 0 : 2);
  }
  if (sufijo === '9' || sufijo === '-9') {
    return esMenor
      ? (FACIL_M9.includes(indice) ? 0 : 2)
      : (FACIL_9.includes(indice) ? 0 : 2);
  }
  if (esMenor) {
    return FACIL_MENOR.includes(indice) ? 0 : MEDIO_MENOR.includes(indice) ? 1 : 2;
  }
  return FACIL_MAYOR.includes(indice) ? 0 : MEDIO_MAYOR.includes(indice) ? 1 : 2;
}

function encontrarMejorCapo(acordesTranspuestos: string[]): CapoResult {
  let mejorCapo = 0;
  let mejorPuntuacion = -1;
  let mejorResultado: string[] = [];
  let mejorDificultad: number[] = [];

  for (let capo = 0; capo <= 11; capo++) {
    let puntuacion = 0;
    const resultado: string[] = [];
    const dificultad: number[] = [];

    for (const acorde of acordesTranspuestos) {
      const parsed = parseAcorde(acorde);
      if (!parsed) {
        resultado.push(acorde);
        dificultad.push(2);
        continue;
      }
      const shapeIndice = ((parsed.indice - capo) % 12 + 12) % 12;
      const diff = calcularDificultad(shapeIndice, parsed.esMenor, parsed.sufijo);
      puntuacion += diff === 0 ? 3 : diff === 1 ? 1 : 0;
      dificultad.push(diff);
      resultado.push(formatearAcorde(shapeIndice, parsed.esMenor, parsed.sufijo));
    }

    if (puntuacion > mejorPuntuacion || (puntuacion === mejorPuntuacion && capo < mejorCapo)) {
      mejorPuntuacion = puntuacion;
      mejorCapo = capo;
      mejorResultado = resultado;
      mejorDificultad = dificultad;
    }
  }

  return {capo: mejorCapo, acordesFaciles: mejorResultado, acordesOriginales: acordesTranspuestos, dificultad: mejorDificultad};
}

export const TransposerScreen: React.FC<TransposerScreenProps> = ({onClose}) => {
  const [acordesElegidos, setAcordesElegidos] = useState<string[]>([]);
  const [semitones, setSemitones] = useState(0);
  const [notaSeleccionada, setNotaSeleccionada] = useState<number | null>(null);
  const [showExtras, setShowExtras] = useState(false);

  const handleSelectNota = (index: number) => {
    setNotaSeleccionada(prev => prev === index ? null : index);
  };

  const handleSelectMod = (mod: Modificador) => {
    if (notaSeleccionada === null) return;
    const chord = formatearAcorde(notaSeleccionada, mod.esMenor, mod.sufijo);
    setAcordesElegidos(prev => [...prev, chord]);
    setNotaSeleccionada(null);
  };

  const handleClear = () => {
    setAcordesElegidos([]);
    setSemitones(0);
    setNotaSeleccionada(null);
  };

  const acordesTranspuestos = acordesElegidos.map(chord => transportarAcorde(chord, semitones));
  const capoResult = acordesTranspuestos.length > 0 ? encontrarMejorCapo(acordesTranspuestos) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Cerrar transportador" accessibilityRole="button">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transportar</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Teclado de Matriz */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Seleccionar Acorde</Text>

          {/* Fila 1: Notas Raíz */}
          <View style={styles.notesRow}>
            {NOTAS.map((nota, i) => (
              <TouchableOpacity
                key={nota}
                style={[
                  styles.noteButton,
                  notaSeleccionada === i && styles.noteButtonActive,
                ]}
                activeOpacity={0.7}
                onPress={() => handleSelectNota(i)}
                accessibilityLabel={`Nota ${nota}`}
                accessibilityRole="button"
                accessibilityState={{selected: notaSeleccionada === i}}>
                <Text style={[
                  styles.noteButtonText,
                  notaSeleccionada === i && styles.noteButtonTextActive,
                ]}>
                  {nota}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fila 2: Modificadores Principales */}
          <View style={styles.modsRow}>
            {MOD_PRINCIPALES.map(mod => (
              <TouchableOpacity
                key={mod.label}
                style={[
                  styles.modButton,
                  notaSeleccionada === null && styles.modButtonDisabled,
                ]}
                activeOpacity={notaSeleccionada === null ? 1 : 0.7}
                onPress={() => handleSelectMod(mod)}
                accessibilityLabel={`Modificador ${mod.label}`}
                accessibilityRole="button"
                accessibilityState={{disabled: notaSeleccionada === null}}>
                <Text style={[
                  styles.modButtonText,
                  notaSeleccionada === null && styles.modButtonTextDisabled,
                ]}>
                  {mod.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modButton, styles.modButtonMore]}
              activeOpacity={0.7}
              onPress={() => setShowExtras(!showExtras)}
              accessibilityLabel={showExtras ? 'Ocultar modificadores extra' : 'Mostrar modificadores extra'}
              accessibilityRole="button"
              accessibilityState={{expanded: showExtras}}>
              <Text style={styles.modButtonTextMore}>
                {showExtras ? '−' : '+'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modificadores Extra (expandible) */}
          {showExtras && (
            <View style={styles.modsExtraRow}>
              {MOD_EXTRA.map(mod => (
                <TouchableOpacity
                  key={mod.label}
                  style={[
                    styles.modButton,
                    styles.modButtonExtra,
                    notaSeleccionada === null && styles.modButtonDisabled,
                  ]}
                  activeOpacity={notaSeleccionada === null ? 1 : 0.7}
                  onPress={() => handleSelectMod(mod)}
                  accessibilityLabel={`Modificador ${mod.label}`}
                  accessibilityRole="button"
                  accessibilityState={{disabled: notaSeleccionada === null}}>
                  <Text style={[
                    styles.modButtonText,
                    notaSeleccionada === null && styles.modButtonTextDisabled,
                  ]}>
                    {mod.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Secuencia Original */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Secuencia Original</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sequenceContainer}>
            {acordesElegidos.length === 0 ? (
              <Text style={styles.placeholderText}>Toca una nota y luego un modificador</Text>
            ) : (
              acordesElegidos.map((chord, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.badge}
                  activeOpacity={0.7}
                  onPress={() => setAcordesElegidos(prev => prev.filter((_, idx) => idx !== i))}
                  accessibilityLabel={`Acorde ${chord}, toca para eliminar`}
                  accessibilityRole="button">
                  <Text style={styles.badgeText}>{chord}</Text>
                  <Text style={styles.badgeRemove}>×</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Controles */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.7}
            onPress={() => setSemitones(prev => prev - 1)}
            accessibilityLabel="Bajar un semitono"
            accessibilityRole="button">
            <Text style={styles.controlButtonText}>−1</Text>
          </TouchableOpacity>
          <Text style={styles.semitoneText}>
            {semitones >= 0 ? '+' : ''}{semitones} st
          </Text>
          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.7}
            onPress={() => setSemitones(prev => prev + 1)}
            accessibilityLabel="Subir un semitono"
            accessibilityRole="button">
            <Text style={styles.controlButtonText}>+1</Text>
          </TouchableOpacity>
        </View>

        {/* Resultado con Capo */}
        <View style={styles.section}>
          <View style={styles.resultHeader}>
            <Text style={styles.sectionLabel}>Con Capo</Text>
            {acordesElegidos.length > 0 && (
              <TouchableOpacity onPress={handleClear} activeOpacity={0.7} accessibilityLabel="Limpiar secuencia" accessibilityRole="button">
                <Text style={styles.clearButton}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>

          {capoResult ? (
            <>
              <View style={styles.capoContainer}>
                <Text style={styles.capoLabel}>Capo</Text>
                <View style={styles.capoBadge}>
                  <Text style={styles.capoNumber}>{capoResult.capo}</Text>
                </View>
                <Text style={styles.capoFret}>traste{capoResult.capo !== 1 ? 's' : ''}</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sequenceContainer}>
                {capoResult.acordesFaciles.map((chord, i) => (
                  <View
                    key={i}
                    style={[
                      styles.badgeEasy,
                      capoResult.dificultad[i] === 0 && styles.badgeEasyFacil,
                      capoResult.dificultad[i] === 1 && styles.badgeEasyMedio,
                      capoResult.dificultad[i] === 2 && styles.badgeEasyDuro,
                    ]}>
                    <Text style={[
                      styles.badgeEasyText,
                      capoResult.dificultad[i] === 2 && styles.badgeEasyTextDuro,
                    ]}>
                      {chord}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : (
            <Text style={styles.placeholderText}>Resultado aquí</Text>
          )}
        </View>

        {/* Resultado Literal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transportación Literal</Text>

          {acordesTranspuestos.length > 0 ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sequenceContainer}>
                {acordesTranspuestos.map((chord, i) => {
                  const parsed = parseAcorde(chord);
                  const diff = parsed ? calcularDificultad(parsed.indice, parsed.esMenor, parsed.sufijo) : 2;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.badgeEasy,
                        diff === 0 && styles.badgeEasyFacil,
                        diff === 1 && styles.badgeEasyMedio,
                        diff === 2 && styles.badgeEasyDuro,
                      ]}>
                      <Text style={[styles.badgeEasyText, diff === 2 && styles.badgeEasyTextDuro]}>
                        {chord}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, {backgroundColor: COLORS.accent}]} />
                  <Text style={styles.legendText}>Fácil</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, {backgroundColor: COLORS.warning}]} />
                  <Text style={styles.legendText}>Cejilla</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, {backgroundColor: COLORS.error}]} />
                  <Text style={styles.legendText}>Difícil</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.placeholderText}>Resultado aquí</Text>
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
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  notesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  noteButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 0,
    width: '22%',
    alignItems: 'center',
  },
  noteButtonActive: {
    backgroundColor: COLORS.accent,
  },
  noteButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  noteButtonTextActive: {
    color: COLORS.background,
  },
  modsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modButtonDisabled: {
    opacity: 0.35,
  },
  modButtonMore: {
    flex: 0.6,
    backgroundColor: COLORS.accent,
  },
  modButtonExtra: {
    flex: 0,
    paddingHorizontal: 14,
  },
  modButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  modButtonTextMore: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '800',
  },
  modsExtraRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  sequenceContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    opacity: 0.5,
  },
  badge: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  badgeRemove: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingVertical: 4,
  },
  controlButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '800',
  },
  semitoneText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  capoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
  },
  capoLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  capoBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capoNumber: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '800',
  },
  capoFret: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  badgeEasy: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surfaceLight,
  },
  badgeEasyFacil: {
    backgroundColor: COLORS.accentDark,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  badgeEasyMedio: {
    backgroundColor: COLORS.warningDark,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  badgeEasyDuro: {
    backgroundColor: COLORS.errorDark,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  badgeEasyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  badgeEasyTextDuro: {
    color: COLORS.error,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
