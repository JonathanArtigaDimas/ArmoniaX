import React, {useState, useMemo, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import {COLORS} from '../constants/theme';
import {SONGS, SongInfo, FolderInfo} from '../data/songs';
import {
  loadCustomSongs,
  saveCustomSong,
  removeCustomSong,
  loadFolders,
  createFolder,
  deleteFolderAndSongs,
  renameFolder,
} from '../utils/songStorage';
import {PdfViewerScreen} from './PdfViewerScreen';

interface FolderScreenProps {
  onClose: () => void;
}

export const FolderScreen: React.FC<FolderScreenProps> = ({onClose}) => {
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [customSongs, setCustomSongs] = useState<SongInfo[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<FolderInfo | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<Set<number>>(new Set());
  const [selectedSong, setSelectedSong] = useState<SongInfo | null>(null);

  useEffect(() => {
    loadFolders().then(setFolders);
    loadCustomSongs().then(setCustomSongs);
  }, []);

  const allSongs = useMemo(() => {
    const map = new Map<number, SongInfo>();
    for (const s of SONGS) {
      map.set(s.cantoNumber, s);
    }
    for (const s of customSongs) {
      map.set(s.cantoNumber, s);
    }
    return Array.from(map.values());
  }, [customSongs]);

  const songsInFolder = useMemo(() => {
    if (!selectedFolder) {
      return allSongs.filter(s => !s.folderId);
    }
    return allSongs.filter(s => s.folderId === selectedFolder.id);
  }, [allSongs, selectedFolder]);

  const songsNotInFolder = useMemo(() => {
    if (!selectedFolder) {
      return [];
    }
    const inFolderIds = new Set(songsInFolder.map(s => s.cantoNumber));
    return allSongs.filter(s => !inFolderIds.has(s.cantoNumber));
  }, [allSongs, selectedFolder, songsInFolder]);

  const filteredAddSongs = useMemo(() => {
    if (addSearch.trim().length === 0) {
      return songsNotInFolder;
    }
    const q = addSearch.toLowerCase();
    return songsNotInFolder.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        String(s.cantoNumber).includes(q),
    );
  }, [songsNotInFolder, addSearch]);

  const filteredFolders = useMemo(() => {
    return folders;
  }, [folders]);

  const folderSongCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of customSongs) {
      if (s.folderId) {
        counts.set(s.folderId, (counts.get(s.folderId) ?? 0) + 1);
      }
    }
    return counts;
  }, [customSongs]);

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (name.length === 0) {
      return;
    }
    const folder = await createFolder(name);
    setFolders(prev => [...prev, folder]);
    setNewFolderName('');
    setShowCreateModal(false);
  }, [newFolderName]);

  const handleRenameFolder = useCallback(async () => {
    if (!editingFolder || !editFolderName.trim()) {
      return;
    }
    await renameFolder(editingFolder.id, editFolderName.trim());
    setFolders(prev =>
      prev.map(f =>
        f.id === editingFolder.id ? {...f, name: editFolderName.trim()} : f,
      ),
    );
    if (selectedFolder?.id === editingFolder.id) {
      setSelectedFolder(prev =>
        prev ? {...prev, name: editFolderName.trim()} : null,
      );
    }
    setEditingFolder(null);
    setEditFolderName('');
  }, [editingFolder, editFolderName, selectedFolder]);

  const handleDeleteFolder = useCallback(
    (folder: FolderInfo) => {
      const count = folderSongCounts.get(folder.id) ?? 0;
      Alert.alert(
        'Eliminar carpeta',
        `¿Eliminar "${folder.name}"?${count > 0 ? `\n\nSe eliminarán ${count} canto${count > 1 ? 's' : ''} que están adentro.` : ''}`,
        [
          {text: 'Cancelar', style: 'cancel'},
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              await deleteFolderAndSongs(folder.id);
              setFolders(prev => prev.filter(f => f.id !== folder.id));
              setCustomSongs(prev =>
                prev.filter(s => s.folderId !== folder.id),
              );
              if (selectedFolder?.id === folder.id) {
                setSelectedFolder(null);
              }
            },
          },
        ],
      );
    },
    [selectedFolder, folderSongCounts],
  );

  const handleFolderLongPress = useCallback(
    (folder: FolderInfo) => {
      Alert.alert(folder.name, '¿Qué quieres hacer?', [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Renombrar',
          onPress: () => {
            setEditingFolder(folder);
            setEditFolderName(folder.name);
          },
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => handleDeleteFolder(folder),
        },
      ]);
    },
    [handleDeleteFolder],
  );

  const handleToggleSongToAdd = useCallback((cantoNumber: number) => {
    setSelectedToAdd(prev => {
      const next = new Set(prev);
      if (next.has(cantoNumber)) {
        next.delete(cantoNumber);
      } else {
        next.add(cantoNumber);
      }
      return next;
    });
  }, []);

  const handleConfirmAddSongs = useCallback(async () => {
    if (!selectedFolder || selectedToAdd.size === 0) {
      return;
    }
    for (const cantoNumber of selectedToAdd) {
      const song = allSongs.find(s => s.cantoNumber === cantoNumber);
      if (song) {
        const updated: SongInfo = {...song, folderId: selectedFolder.id};
        await saveCustomSong(updated);
      }
    }
    const updated = await loadCustomSongs();
    setCustomSongs(updated);
    setSelectedToAdd(new Set());
    setShowAddSongs(false);
    setAddSearch('');
  }, [selectedFolder, selectedToAdd, allSongs]);

  const handleRemoveSongFromFolder = useCallback(
    (song: SongInfo) => {
      Alert.alert(
        'Quitar de carpeta',
        `¿Quitar "${song.name}" de esta carpeta?`,
        [
          {text: 'Cancelar', style: 'cancel'},
          {
            text: 'Quitar',
            onPress: async () => {
              await removeCustomSong(song.cantoNumber);
              const updated = await loadCustomSongs();
              setCustomSongs(updated);
            },
          },
        ],
      );
    },
    [],
  );

  const handleOpenAddSongs = useCallback(() => {
    setSelectedToAdd(new Set());
    setAddSearch('');
    setShowAddSongs(true);
  }, []);

  const renderFolder = useCallback(
    ({item}: {item: FolderInfo}) => (
      <TouchableOpacity
        style={styles.folderRow}
        activeOpacity={0.7}
        onPress={() => setSelectedFolder(item)}
        onLongPress={() => handleFolderLongPress(item)}>
        <View style={styles.folderIcon}>
          <Text style={styles.folderEmoji}>📁</Text>
        </View>
        <View style={styles.folderInfo}>
          <Text style={styles.folderName}>{item.name}</Text>
          <Text style={styles.folderCount}>
            {folderSongCounts.get(item.id) ?? 0} canto
            {(folderSongCounts.get(item.id) ?? 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.folderArrow}>›</Text>
      </TouchableOpacity>
    ),
    [handleFolderLongPress, folderSongCounts],
  );

  const renderSongInFolder = useCallback(
    ({item}: {item: SongInfo}) => (
      <TouchableOpacity
        style={styles.songButton}
        activeOpacity={0.7}
        onPress={() => setSelectedSong(item)}
        onLongPress={() => handleRemoveSongFromFolder(item)}>
        <Text style={styles.songName}>{item.name}</Text>
        <Text style={styles.songPage}>Canto {item.cantoNumber}</Text>
      </TouchableOpacity>
    ),
    [handleRemoveSongFromFolder],
  );

  const renderAddSongItem = useCallback(
    ({item}: {item: SongInfo}) => {
      const isSelected = selectedToAdd.has(item.cantoNumber);
      return (
        <TouchableOpacity
          style={[styles.addSongRow, isSelected && styles.addSongRowSelected]}
          activeOpacity={0.7}
          onPress={() => handleToggleSongToAdd(item.cantoNumber)}>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.addSongInfo}>
            <Text style={styles.songName}>{item.name}</Text>
            <Text style={styles.songPage}>Canto {item.cantoNumber}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedToAdd, handleToggleSongToAdd],
  );

  const isInFolderView = selectedFolder !== null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={isInFolderView ? () => setSelectedFolder(null) : onClose}
          style={styles.closeButton}>
          <Text style={styles.closeText}>{isInFolderView ? '←' : '✕'}</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {isInFolderView ? selectedFolder.name : 'Carpetas'}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={isInFolderView ? handleOpenAddSongs : () => setShowCreateModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {!isInFolderView ? (
        <FlatList
          data={filteredFolders}
          renderItem={renderFolder}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay carpetas creadas</Text>
          }
        />
      ) : (
        <FlatList
          data={songsInFolder}
          renderItem={renderSongInFolder}
          keyExtractor={item => `${item.cantoNumber}-${item.name}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No hay cantos en esta carpeta. Toca + para agregar.
            </Text>
          }
        />
      )}

      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowCreateModal(false);
          setNewFolderName('');
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva carpeta</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre de la carpeta"
              placeholderTextColor={COLORS.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewFolderName('');
                }}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  newFolderName.trim().length === 0 &&
                    styles.modalConfirmDisabled,
                ]}
                onPress={handleCreateFolder}
                disabled={newFolderName.trim().length === 0}>
                <Text style={styles.modalConfirmText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!editingFolder}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setEditingFolder(null);
          setEditFolderName('');
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Renombrar carpeta</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nuevo nombre"
              placeholderTextColor={COLORS.textSecondary}
              value={editFolderName}
              onChangeText={setEditFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setEditingFolder(null);
                  setEditFolderName('');
                }}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  editFolderName.trim().length === 0 &&
                    styles.modalConfirmDisabled,
                ]}
                onPress={handleRenameFolder}
                disabled={editFolderName.trim().length === 0}>
                <Text style={styles.modalConfirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddSongs}
        animationType="slide"
        onRequestClose={() => {
          setShowAddSongs(false);
          setAddSearch('');
          setSelectedToAdd(new Set());
        }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                setShowAddSongs(false);
                setAddSearch('');
                setSelectedToAdd(new Set());
              }}
              style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={1}>
              Agregar cantos
            </Text>
            <TouchableOpacity
              style={[
                styles.confirmAddButton,
                selectedToAdd.size === 0 && styles.confirmAddButtonDisabled,
              ]}
              onPress={handleConfirmAddSongs}
              disabled={selectedToAdd.size === 0}>
              <Text style={styles.confirmAddText}>
                Agregar ({selectedToAdd.size})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar canto..."
              placeholderTextColor={COLORS.textSecondary}
              value={addSearch}
              onChangeText={setAddSearch}
            />
          </View>

          <FlatList
            data={filteredAddSongs}
            renderItem={renderAddSongItem}
            keyExtractor={item => `${item.cantoNumber}-${item.name}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {songsNotInFolder.length === 0
                  ? 'Todos los cantos ya están en esta carpeta'
                  : 'No se encontraron cantos'}
              </Text>
            }
          />
        </View>
      </Modal>

      <Modal
        visible={selectedSong !== null}
        animationType="slide"
        onRequestClose={() => setSelectedSong(null)}>
        {selectedSong && (
          <PdfViewerScreen
            songName={selectedSong.name}
            cantoNumber={selectedSong.cantoNumber}
            pages={selectedSong.pages}
            onClose={() => setSelectedSong(null)}
          />
        )}
      </Modal>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#121212',
    fontSize: 22,
    fontWeight: '700',
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
  folderRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  folderEmoji: {
    fontSize: 18,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  folderCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  folderArrow: {
    color: COLORS.textSecondary,
    fontSize: 22,
    fontWeight: '300',
    marginLeft: 8,
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
  addSongRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSongRowSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.background,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  checkmark: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '700',
  },
  addSongInfo: {
    flex: 1,
  },
  confirmAddButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  confirmAddButtonDisabled: {
    opacity: 0.4,
  },
  confirmAddText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
  },
  modalConfirmDisabled: {
    opacity: 0.4,
  },
  modalConfirmText: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '700',
  },
});
