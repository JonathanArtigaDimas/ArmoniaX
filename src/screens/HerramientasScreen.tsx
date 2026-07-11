import React, {useState, Suspense} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator} from 'react-native';
import {COLORS, SPACING} from '../constants/theme';

const MetronomeScreen = React.lazy(() =>
  import('./MetronomeScreen').then(m => ({default: m.MetronomeScreen})),
);
const TransposerScreen = React.lazy(() =>
  import('./TransposerScreen').then(m => ({default: m.TransposerScreen})),
);
const SongsListScreen = React.lazy(() =>
  import('./SongsListScreen').then(m => ({default: m.SongsListScreen})),
);
const ChordLibraryScreen = React.lazy(() =>
  import('./ChordLibraryScreen').then(m => ({default: m.ChordLibraryScreen})),
);
const FolderScreen = React.lazy(() =>
  import('./FolderScreen').then(m => ({default: m.FolderScreen})),
);

const Fallback = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background}}>
    <ActivityIndicator size="large" color={COLORS.accent} />
  </View>
);

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

export const HerramientasScreen: React.FC = () => {
  const [showMetronome, setShowMetronome] = useState(false);
  const [showChordLibrary, setShowChordLibrary] = useState(false);
  const [showTransposer, setShowTransposer] = useState(false);
  const [showCantos, setShowCantos] = useState(false);
  const [showCarpetas, setShowCarpetas] = useState(false);

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
            <ToolButton title="Carpetas" onPress={() => setShowCarpetas(true)} />
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
            <SongsListScreen onClose={() => setShowCantos(false)} />
          </Suspense>
        </Modal>
      )}
      {showCarpetas && (
        <Modal
          visible={showCarpetas}
          animationType="slide"
          onRequestClose={() => setShowCarpetas(false)}>
          <Suspense fallback={<Fallback />}>
            <FolderScreen onClose={() => setShowCarpetas(false)} />
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
