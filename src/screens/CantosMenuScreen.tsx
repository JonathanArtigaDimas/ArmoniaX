/**
 * CantosMenuScreen.tsx - Menú de opciones de cantos
 *
 * Pantalla intermedia que se muestra al tocar "Cantos" en HerramientasScreen.
 * Presenta 3 opciones como cards atractivas:
 *
 * 1. CNC (activo): Lista de ~300 cantos del himnario con búsqueda
 * 2. TRADICIONAL (deshabilitado): Próximamente
 * 3. Carpetas (activo): Gestión de carpetas personalizadas
 *
 * Cada card tiene un ícono, título y subtítulo descriptivo.
 * Las cards activas abren la pantalla correspondiente en modal.
 * La card de Tradicional tiene opacidad reducida y badge "Próximamente".
 */
import React, {useState, Suspense} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {COLORS, SPACING} from '../constants/theme';

/**
 * Lazy loading de las pantallas de cantos.
 * Se cargan solo cuando el usuario selecciona una opción.
 */
const SongsListScreen = React.lazy(() =>
  import('./SongsListScreen').then(m => ({default: m.SongsListScreen})),
);
const FolderScreen = React.lazy(() =>
  import('./FolderScreen').then(m => ({default: m.FolderScreen})),
);

/** Componente de carga mientras se descarga la pantalla */
const Fallback = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background}}>
    <ActivityIndicator size="large" color={COLORS.accent} />
  </View>
);

/** Props del menú de cantos */
interface CantosMenuScreenProps {
  onClose: () => void; // Callback para cerrar el modal
}

/**
 * Pantalla menú de opciones de cantos.
 * Muestra 3 cards navegables: CNC, Tradicional y Carpetas.
 */
export const CantosMenuScreen: React.FC<CantosMenuScreenProps> = ({onClose}) => {
  const [showCNC, setShowCNC] = useState(false);
  const [showCarpetas, setShowCarpetas] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Cerrar cantos" accessibilityRole="button">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cantos</Text>
        <View style={{width: 40}} />
      </View>

      {/* Cards de opciones */}
      <View style={styles.cardsContainer}>
        {/* Card CNC - Activa */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => setShowCNC(true)}
          accessibilityLabel="CNC, cantos con acordes"
          accessibilityRole="button">
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>🎵</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>CNC</Text>
            <Text style={styles.cardSubtitle}>Cantos con acordes</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        {/* Card Tradicional - Deshabilitada */}
        <View style={[styles.card, styles.cardDisabled]}>
          <View style={[styles.cardIconContainer, styles.cardIconDisabled]}>
            <Text style={[styles.cardIcon, styles.cardIconTextDisabled]}>📖</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, styles.cardTitleDisabled]}>Tradicional</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Próximamente</Text>
              </View>
            </View>
            <Text style={[styles.cardSubtitle, styles.cardSubtitleDisabled]}>
              Canto sin acordes
            </Text>
          </View>
        </View>

        {/* Card Carpetas - Activa */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => setShowCarpetas(true)}
          accessibilityLabel="Carpetas, organiza tus cantos"
          accessibilityRole="button">
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>📁</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Carpetas</Text>
            <Text style={styles.cardSubtitle}>Organiza tus cantos</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Modal CNC - SongsListScreen */}
      {showCNC && (
        <Modal
          visible={showCNC}
          animationType="slide"
          onRequestClose={() => setShowCNC(false)}>
          <Suspense fallback={<Fallback />}>
            <SongsListScreen onClose={() => setShowCNC(false)} />
          </Suspense>
        </Modal>
      )}

      {/* Modal Carpetas - FolderScreen */}
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
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIconDisabled: {
    backgroundColor: COLORS.background,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardIconTextDisabled: {
    opacity: 0.6,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardTitleDisabled: {
    color: COLORS.textSecondary,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '400',
  },
  cardSubtitleDisabled: {
    opacity: 0.7,
  },
  badge: {
    backgroundColor: COLORS.warningDark,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  badgeText: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardArrow: {
    color: COLORS.textSecondary,
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 8,
  },
});
