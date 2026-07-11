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

const PdfViewerScreen = React.lazy(() =>
  import('./PdfViewerScreen').then(m => ({default: m.PdfViewerScreen})),
);

interface SongsListScreenProps {
  onClose: () => void;
}

export const SongsListScreen: React.FC<SongsListScreenProps> = ({onClose}) => {
  const [search, setSearch] = useState('');
  const [selectedSong, setSelectedSong] = useState<SongInfo | null>(null);

  const filteredSongs = useMemo(() => {
    if (search.trim().length === 0) {
      return SONGS;
    }
    const query = search.toLowerCase();
    return SONGS.filter(
      s =>
        s.name.toLowerCase().includes(query) ||
        String(s.cantoNumber).includes(query),
    );
  }, [search]);

  const renderItem = useCallback(
    ({item}: {item: SongInfo}) => (
      <TouchableOpacity
        style={styles.songButton}
        activeOpacity={0.7}
        onPress={() => setSelectedSong(item)}
        accessibilityLabel={`${item.name}, Canto ${item.cantoNumber}`}
        accessibilityRole="button">
        <Text style={styles.songName}>{item.name}</Text>
        <Text style={styles.songPage}>Canto {item.cantoNumber}</Text>
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
});
