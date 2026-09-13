/**
 * SongsListScreen.tsx - Lista de búsqueda de cantos del himnario
 *
 * Pantalla que muestra los ~300 cantos del himnario iResucito
 * en una lista con búsqueda en tiempo real.
 *
 * Características:
 * - FlatList optimizado para listas grandes
 * - Búsqueda por nombre o número de canto
 * - Cada canto muestra nombre y número (ej: "Alabaré - Canto 123")
 * - Al seleccionar un canto, abre PdfViewerScreen en modal
 * - Lazy loading de PdfViewerScreen (React.lazy)
 *
 * Los datos vienen de SONGS (generado desde songMapping.ts).
 *
 * Optimizaciones:
 * - initialNumToRender: 15 (carga inicial rápida)
 * - maxToRenderPerBatch: 20
 * - windowSize: 5 (renderizado virtual)
 * - useMemo para la búsqueda filtrada
 * - useCallback para renderizado de items
 *
 * Usado como modal desde HerramientasScreen.
 */
import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import {COLORS} from '../constants/theme';
import {SONGS, SongInfo} from '../data/songs';

/**
 * Normaliza un texto eliminando tildes, acentos y diacríticos.
 * Usa Unicode NFD para descomponer caracteres (ej: "á" → "a" + "´")
 * y luego elimina los marcos combinantes.
 *
 * Ejemplo: "María" → "maria", "¡Aleluya!" → "aleluya"
 */
const normalizeText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // elimina diacríticos (tildes, eñe, etc.)
    .replace(/['¡!¿?]/g, '')          // elimina signos de puntuación especiales
    .toLowerCase();

const CATECUMENADO_SONGS = new Set([
  'Como el impulso que siente la ira',
  'Cuando dormía',
  'Débora',
  'El mismo Dios',
  'El sembrador',
  'He aquí que nuestro espejo es el Señor',
  'Himno a la cruz gloriosa',
  'Jacob',
  'Ninguno puede servir a dos señores',
  'No resistáis al mal',
  'No sufras por los malvados',
  'Oh Señor, mi corazón ya no es ambicioso',
  'Señor, tú me escrutas',
  'Shemá Israel',
  'Siéntate solitario y silencioso',
  'Tú eres mi esperanza, Señor',
]);

const ELECCION_SONGS = new Set([
  'A la cena del cordero',
  'Adónde te escondiste amado',
  'Como destila la miel',
  'Como lirio entre los cardos',
  'Hermosa eres, amiga mia',
  'La paloma volo',
  'Me robaste el corazón',
  'Suba el esposo al leño de su tálamo',
]);

const LITURGIA_SONGS = new Set([
  'Aleluya Pascual',
  'Amén, amén, amén',
  'Bendición del agua',
  'Letanía del Cordero de Dios',
  'Credo',
  'Gloria a Dios en lo alto del cielo',
  'Padre Nuestro',
  'Pregón Pascual',
  'Salmodia para las Oraciones Universales',
  'Santo 1982',
  'Santo 1988',
  'Santo Hebreo',
  'Santo Palestina 74',
  'Santo Palomeras 65',
  'Santo Roma 77',
  'Te deum',
]);

const PdfViewerScreen = React.lazy(() =>
  import('./PdfViewerScreen').then(m => ({default: m.PdfViewerScreen})),
);

interface SongsListScreenProps {
  onClose: () => void;
}

type FilterCategory = 'Catecumenado' | 'Precatecumenado' | 'Elección' | 'Liturgia' | null;

const FILTER_OPTIONS: FilterCategory[] = ['Catecumenado', 'Precatecumenado', 'Elección', 'Liturgia'];

const FILTER_COLORS: Record<string, string> = {
  'Catecumenado': '#1E3A5F',
  'Precatecumenado': '#FFFFFF',
  'Elección': '#1E5F3A',
  'Liturgia': '#5F4B1E',
};

/**
 * Lista de cantos del himnario con búsqueda.
 * Al seleccionar un canto, abre el visor de PDF/ChordPro.
 */
export const SongsListScreen: React.FC<SongsListScreenProps> = ({onClose}) => {
  const [search, setSearch] = useState('');
  const [selectedSong, setSelectedSong] = useState<SongInfo | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>(null);

  const filteredSongs = useMemo(() => {
    let result = SONGS;

    if (activeFilter) {
      result = result.filter(s => {
        if (activeFilter === 'Catecumenado') return CATECUMENADO_SONGS.has(s.name);
        if (activeFilter === 'Elección') return ELECCION_SONGS.has(s.name);
        if (activeFilter === 'Liturgia') return LITURGIA_SONGS.has(s.name);
        if (activeFilter === 'Precatecumenado')
          return !CATECUMENADO_SONGS.has(s.name) && !ELECCION_SONGS.has(s.name) && !LITURGIA_SONGS.has(s.name);
        return true;
      });
    }

    if (search.trim().length > 0) {
      const query = normalizeText(search);
      result = result.filter(
        s =>
          normalizeText(s.name).includes(query) ||
          String(s.cantoNumber).includes(query),
      );
    }

    return result;
  }, [search, activeFilter]);

  const renderItem = useCallback(
    ({item}: {item: SongInfo}) => (
      <TouchableOpacity
        style={styles.songButton}
        activeOpacity={0.7}
        onPress={() => setSelectedSong(item)}
        accessibilityLabel={`${item.name}, Canto ${item.cantoNumber}`}
        accessibilityRole="button">
        <Text style={styles.songName}>{item.name}</Text>
        <View style={styles.songRight}>
          {CATECUMENADO_SONGS.has(item.name) && (
            <View style={styles.catecBadge}>
              <Text style={styles.catecBadgeText}>Catecumenado</Text>
            </View>
          )}
          {ELECCION_SONGS.has(item.name) && (
            <View style={styles.eleccionBadge}>
              <Text style={styles.eleccionBadgeText}>Elección</Text>
            </View>
          )}
          {LITURGIA_SONGS.has(item.name) && (
            <View style={styles.liturgiaBadge}>
              <Text style={styles.liturgiaBadgeText}>Liturgia</Text>
            </View>
          )}
          {!CATECUMENADO_SONGS.has(item.name) &&
           !ELECCION_SONGS.has(item.name) &&
           !LITURGIA_SONGS.has(item.name) && (
            <View style={styles.precatecBadge}>
              <Text style={styles.precatecBadgeText}>Precatecumenado</Text>
            </View>
          )}
          <Text style={styles.songPage}>Canto {item.cantoNumber}</Text>
        </View>
      </TouchableOpacity>
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: SongInfo) => `${item.cantoNumber}-${item.name}`,
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Cerrar cantos" accessibilityRole="button">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          Cantos
        </Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar canto..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Buscar canto"
        />
      </View>

      <View style={styles.filterContainer}>
        {FILTER_OPTIONS.map(filter => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                isActive && {backgroundColor: FILTER_COLORS[filter!], borderColor: FILTER_COLORS[filter!]},
              ]}
              onPress={() => setActiveFilter(isActive ? null : filter)}>
              <Text style={[
                styles.filterButtonText,
                isActive && {color: filter === 'Precatecumenado' ? '#121212' : '#FFFFFF'},
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredSongs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se encontraron cantos</Text>
        }
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={5}
      />

      {selectedSong && (
        <Modal
          visible={true}
          animationType="slide"
          onRequestClose={() => setSelectedSong(null)}>
          <React.Suspense fallback={null}>
            <PdfViewerScreen
              songName={selectedSong.name}
              cantoNumber={selectedSong.cantoNumber}
              pages={selectedSong.pages}
              onClose={() => setSelectedSong(null)}
            />
          </React.Suspense>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  filterButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.6,
  },
  songButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  songName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  songPage: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '400',
  },
  songRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catecBadge: {
    backgroundColor: '#1E3A5F',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catecBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  eleccionBadge: {
    backgroundColor: '#1E5F3A',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eleccionBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  liturgiaBadge: {
    backgroundColor: '#5F4B1E',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liturgiaBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  precatecBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  precatecBadgeText: {
    color: '#121212',
    fontSize: 10,
    fontWeight: '600',
  },
});
