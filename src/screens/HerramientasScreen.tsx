/**
 * HerramientasScreen.tsx - Hub de herramientas musicales
 *
 * Pantalla principal de la pestaña "Herramientas".
 * Muestra una lista de botones que abren herramientas como modales full-screen.
 *
 * Herramientas disponibles:
 * - Metrónomo: BPM, compases, presets de tempo
 * - Biblioteca de acordes: diagramas para guitarra y charango
 * - Transportar: transpose acordes y calcula capo óptimo
 * - Cantos: menú con opciones CNC, Tradicional y Carpetas
 *
 * Cada herramienta se carga con React.lazy() para code-splitting.
 * Se abren como modales con animación slide.
 */
import React, {useState, Suspense} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator} from 'react-native';
import {COLORS, SPACING} from '../constants/theme';

/**
 * Lazy loading de herramientas.
 * Cada pantalla se importa dinámicamente para reducir el bundle inicial.
 * Se cargan solo cuando el usuario abre la herramienta.
 */
const MetronomeScreen = React.lazy(() =>
  import('./MetronomeScreen').then(m => ({default: m.MetronomeScreen})),
);
const TransposerScreen = React.lazy(() =>
  import('./TransposerScreen').then(m => ({default: m.TransposerScreen})),
);
const CantosMenuScreen = React.lazy(() =>
  import('./CantosMenuScreen').then(m => ({default: m.CantosMenuScreen})),
);
const ChordLibraryScreen = React.lazy(() =>
  import('./ChordLibraryScreen').then(m => ({default: m.ChordLibraryScreen})),
);

/** Componente de carga mientras se descarga la herramienta (Suspense fallback) */
const Fallback = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background}}>
    <ActivityIndicator size="large" color={COLORS.accent} />
  </View>
);

/**
 * Botón reutilizable para cada herramienta.
 * Muestra el nombre de la herramienta con estilo de card.
 */
const ToolButton: React.FC<{title: string; onPress: () => void}> = ({title, onPress}) => (
  <TouchableOpacity
    style={styles.toolButton}
    activeOpacity={0.7}
    onPress={onPress}
    accessibilityLabel={title}
    accessibilityRole="button">
    <Text style={styles.toolButtonText}>{title}</Text>
  </TouchableOpacity>
);

/**
 * Pantalla hub de herramientas musicales.
 * Cada herramienta se abre como modal con lazy loading.
 */
export const HerramientasScreen: React.FC = () => {
  const [showMetronome, setShowMetronome] = useState(false);
  const [showChordLibrary, setShowChordLibrary] = useState(false);
  const [showTransposer, setShowTransposer] = useState(false);
  const [showCantos, setShowCantos] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}>
        <Text style={styles.screenTitle}>Herramientas</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acordes y otros</Text>
          <View style={styles.sectionContent}>
            <ToolButton title="Metrónomo" onPress={() => setShowMetronome(true)} />
            <ToolButton title="Biblioteca de acordes" onPress={() => setShowChordLibrary(true)} />
            <ToolButton title="Transportar" onPress={() => setShowTransposer(true)} />
            <ToolButton title="Cantos" onPress={() => setShowCantos(true)} />
          </View>
        </View>
      </ScrollView>

      {showMetronome && (
        <Modal
          visible={showMetronome}
          animationType="slide"
          onRequestClose={() => setShowMetronome(false)}>
          <Suspense fallback={<Fallback />}>
            <MetronomeScreen onClose={() => setShowMetronome(false)} />
          </Suspense>
        </Modal>
      )}
      {showChordLibrary && (
        <Modal
          visible={showChordLibrary}
          animationType="slide"
          onRequestClose={() => setShowChordLibrary(false)}>
          <Suspense fallback={<Fallback />}>
            <ChordLibraryScreen onClose={() => setShowChordLibrary(false)} />
          </Suspense>
        </Modal>
      )}
      {showTransposer && (
        <Modal
          visible={showTransposer}
          animationType="slide"
          onRequestClose={() => setShowTransposer(false)}>
          <Suspense fallback={<Fallback />}>
            <TransposerScreen onClose={() => setShowTransposer(false)} />
          </Suspense>
        </Modal>
      )}
      {showCantos && (
        <Modal
          visible={showCantos}
          animationType="slide"
          onRequestClose={() => setShowCantos(false)}>
          <Suspense fallback={<Fallback />}>
            <CantosMenuScreen onClose={() => setShowCantos(false)} />
          </Suspense>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.screenPadding,
    paddingBottom: SPACING.screenPaddingBottom,
  },
  screenTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.sectionGap,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: SPACING.lg,
  },
  sectionContent: {
    gap: SPACING.buttonGap,
  },
  toolButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toolButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
});
