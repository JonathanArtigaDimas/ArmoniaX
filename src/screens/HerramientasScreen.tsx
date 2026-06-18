import React, {useState, Suspense} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator} from 'react-native';
import {COLORS} from '../constants/theme';

const MetronomeScreen = React.lazy(() =>
  import('../components/MetronomeScreen').then(m => ({default: m.MetronomeScreen})),
);
const TransposerScreen = React.lazy(() =>
  import('../components/TransposerScreen').then(m => ({default: m.TransposerScreen})),
);
const SongsListScreen = React.lazy(() =>
  import('../components/SongsListScreen').then(m => ({default: m.SongsListScreen})),
);
const ChordLibraryScreen = React.lazy(() =>
  import('../components/ChordLibraryScreen').then(m => ({default: m.ChordLibraryScreen})),
);
const FolderScreen = React.lazy(() =>
  import('../components/FolderScreen').then(m => ({default: m.FolderScreen})),
);

const Fallback = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background}}>
    <ActivityIndicator size="large" color={COLORS.accent} />
  </View>
);

const ToolButton: React.FC<{title: string; onPress: () => void}> = ({title, onPress}) => (
  <TouchableOpacity style={styles.toolButton} activeOpacity={0.7} onPress={onPress}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Afinación</Text>
          <View style={styles.sectionContent}>
            <View style={styles.toolButtonDisabled}>
              <Text style={styles.toolButtonText}>Afinaciones Personalizadas</Text>
              <Text style={styles.comingSoonLabel}>Próximamente</Text>
            </View>
            <View style={styles.toolButtonDisabled}>
              <Text style={styles.toolButtonText}>Configuración Vocal</Text>
              <Text style={styles.comingSoonLabel}>Próximamente</Text>
            </View>
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
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  sectionContent: {
    gap: 10,
  },
  toolButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toolButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  toolButtonDisabled: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  comingSoonLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
