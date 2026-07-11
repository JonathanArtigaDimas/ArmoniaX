import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Pdf from 'react-native-pdf';
import {COLORS} from '../constants/theme';
import {extractPdfPages} from '../utils/pdfExtractor';
import {loadNote, saveNote} from '../utils/noteStorage';
import {
  CapoSuggestion,
  loadCapoSuggestions,
  saveCapoSuggestion,
  removeCapoSuggestion,
} from '../utils/capoStorage';
import {lookupChordPro} from '../data/chordProData';
import {
  parseChordPro,
  extractMetadata,
  getDisplayLines,
  ChordProParsedLine,
  extractUniqueChords,
  suggestCapo,
  isAllEasy,
} from '../utils/chordProParser';
import {transposeChord} from '../utils/chordTransposer';

interface PdfViewerScreenProps {
  songName: string;
  cantoNumber: number;
  pages?: number[];
  page?: number;
  onClose: () => void;
}

export const PdfViewerScreen: React.FC<PdfViewerScreenProps> = ({
  songName,
  cantoNumber,
  pages,
  page,
  onClose,
}) => {
  const pdfRef = useRef<any>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showChords, setShowChords] = useState(false);
  const [chordProText, setChordProText] = useState<string | null>(null);

  const [transposeOffset, setTransposeOffset] = useState(0);
  const [savedCapoActive, setSavedCapoActive] = useState(false);
  const [activeSavedCapo, setActiveSavedCapo] = useState<number | null>(null);
  const [savedSuggestions, setSavedSuggestions] = useState<CapoSuggestion[]>([]);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [newSuggestionName, setNewSuggestionName] = useState('');

  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notePreview, setNotePreview] = useState('');

  const resolvedPages = pages ?? (page ? [page] : []);
  const hasPdfPages = resolvedPages.length > 0;
  const sortedPages = [...resolvedPages].sort((a, b) => a - b);
  const pageInfo =
    sortedPages.length === 1
      ? `Pág. ${sortedPages[0]}`
      : sortedPages.length > 1
      ? `Pág. ${sortedPages[0]}-${sortedPages[sortedPages.length - 1]}`
      : '';

  useEffect(() => {
    loadNote(cantoNumber).then(text => {
      setNotePreview(text);
    });
  }, [cantoNumber]);

  useEffect(() => {
    if (!hasPdfPages) {
      setLoading(false);
      handleShowChords();
      return;
    }

    let cancelled = false;

    async function loadPdf() {
      try {
        const uri = await extractPdfPages(resolvedPages);
        if (!cancelled) {
          setPdfUri(uri);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err));
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [resolvedPages, hasPdfPages]);

  const handleShowChords = useCallback(async () => {
    setShowChords(true);
    setTransposeOffset(0);
    setSavedCapoActive(false);
    setActiveSavedCapo(null);
    const text = lookupChordPro(songName);
    setChordProText(text);
    const saved = await loadCapoSuggestions(songName);
    setSavedSuggestions(saved);
  }, [songName]);

  const handleOpenNote = useCallback(async () => {
    const text = await loadNote(cantoNumber);
    setNoteText(text);
    setShowNote(true);
  }, [cantoNumber]);

  const handleSaveNote = useCallback(async () => {
    await saveNote(cantoNumber, noteText);
    setNotePreview(noteText);
    setShowNote(false);
  }, [cantoNumber, noteText]);

  const handleSaveCapoSuggestion = useCallback(async () => {
    if (!newSuggestionName.trim()) {
      return;
    }
    await saveCapoSuggestion(songName, {
      name: newSuggestionName.trim(),
      offset: transposeOffset,
      capo: activeSavedCapo ?? 0,
    });
    const updated = await loadCapoSuggestions(songName);
    setSavedSuggestions(updated);
    setNewSuggestionName('');
    setShowSaveInput(false);
  }, [songName, activeSavedCapo, transposeOffset, newSuggestionName]);

  const handleDeleteCapoSuggestion = useCallback((index: number) => {
    Alert.alert(
      'Eliminar sugerencia',
      `¿Eliminar "${savedSuggestions[index].name}"?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await removeCapoSuggestion(songName, index);
            const updated = await loadCapoSuggestions(songName);
            setSavedSuggestions(updated);
          },
        },
      ],
    );
  }, [songName, savedSuggestions]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title} numberOfLines={1}>
            {songName}
          </Text>
          <Text style={styles.pageInfo}>{pageInfo || 'Acordes'}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleShowChords} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>♫</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenNote}
            style={styles.headerButton}>
            <Text style={styles.headerButtonText}>+</Text>
            {notePreview.trim().length > 0 && <View style={styles.noteDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {notePreview.trim().length > 0 && (
        <TouchableOpacity
          style={styles.notePreviewCard}
          onPress={handleOpenNote}
          activeOpacity={0.7}>
          <Text style={styles.notePreviewLabel}>Nota personalizada</Text>
          <Text style={styles.notePreviewText} numberOfLines={3}>
            {notePreview}
          </Text>
        </TouchableOpacity>
      )}

      {loading && hasPdfPages && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Extrayendo páginas...</Text>
        </View>
      )}

      {error && (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              setPdfUri(null);
            }}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {pdfUri && (
        <Pdf
          ref={pdfRef}
          source={{uri: `file://${pdfUri}`}}
          scale={1.0}
          minScale={0.5}
          maxScale={3.0}
          enablePaging={false}
          horizontal={false}
          fitPolicy={0}
          spacing={10}
          onLoadComplete={() => {
            setLoading(false);
          }}
          onError={(err) => {
            setLoading(false);
            setError(String(err));
          }}
          style={[styles.pdf, loading && styles.pdfHidden]}
        />
      )}

      {!hasPdfPages && !loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Presiona ♫ para ver los acordes</Text>
        </View>
      )}

      <Modal
        visible={showChords}
        animationType="slide"
        onRequestClose={() => {
          setShowChords(false);
          setTransposeOffset(0);
        }}>
        <View style={styles.chordsContainer}>
          <View style={styles.chordsHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowChords(false);
                setTransposeOffset(0);
              }}
              style={[styles.closeButton, {backgroundColor: '#F0F0F0'}]}>
              <Text style={[styles.closeText, {color: '#333333'}]}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.chordsTitle} numberOfLines={1}>
              {songName}
            </Text>
            <View style={{width: 40}} />
          </View>

          {chordProText && (() => {
            const originalChords = extractUniqueChords(chordProText);
            const currentChords = transposeOffset === 0
              ? originalChords
              : originalChords.map(c => transposeChord(c, transposeOffset, true));
            const capoSug = isAllEasy(currentChords) ? null : suggestCapo(currentChords);
            const displayCapo = transposeOffset === 0
              ? null
              : (savedCapoActive ? activeSavedCapo : (capoSug ? capoSug.capo : null));
            return (
              <View style={styles.transposeBar}>
                {transposeOffset !== 0 && (
                  <TouchableOpacity
                    style={styles.originalButton}
                    onPress={() => { setSavedCapoActive(false); setActiveSavedCapo(null); setTransposeOffset(0); }}>
                    <Text style={styles.originalButtonText}>Original</Text>
                  </TouchableOpacity>
                )}
                {displayCapo != null && displayCapo > 0 && (
                  <Text style={styles.capoIndicator}>Capo {displayCapo}</Text>
                )}
                <TouchableOpacity
                  style={styles.transposeButton}
                  onPress={() => { setSavedCapoActive(false); setActiveSavedCapo(null); setTransposeOffset(prev => Math.max(prev - 1, -11)); }}>
                  <Text style={styles.transposeButtonText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.transposeReset}
                  onPress={() => { setSavedCapoActive(false); setActiveSavedCapo(null); setTransposeOffset(0); }}>
                  <Text style={styles.transposeLabel}>
                    {transposeOffset === 0
                      ? 'Original'
                      : `${transposeOffset > 0 ? '+' : ''}${transposeOffset} semitonos`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.transposeButton}
                  onPress={() => { setSavedCapoActive(false); setActiveSavedCapo(null); setTransposeOffset(prev => Math.min(prev + 1, 11)); }}>
                  <Text style={styles.transposeButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            );
          })()}

          {transposeOffset !== 0 && !savedSuggestions.some(s => s.offset === transposeOffset) && (
            <View style={styles.saveSuggestionContainer}>
              <TouchableOpacity
                style={styles.saveSuggestionButton}
                onPress={() => setShowSaveInput(true)}>
                <Text style={styles.saveSuggestionButtonText}>Guardar configuración</Text>
              </TouchableOpacity>
            </View>
          )}

          {chordProText && (() => {
            const originalChords = extractUniqueChords(chordProText);
            const currentChords = transposeOffset === 0
              ? originalChords
              : originalChords.map(c => transposeChord(c, transposeOffset, true));
            return (
              <>
                {savedSuggestions.length > 0 && (
                  <View style={styles.savedSuggestionsContainer}>
                    {savedSuggestions.map((saved, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.savedSuggestionChip}
                        onPress={() => { setSavedCapoActive(true); setActiveSavedCapo(saved.capo); setTransposeOffset(saved.offset); }}
                        onLongPress={() => handleDeleteCapoSuggestion(idx)}>
                        <Text style={styles.savedSuggestionChipText}>{saved.name}</Text>
                        <Text style={styles.savedSuggestionCapo}>{saved.capo > 0 ? `Capo ${saved.capo}` : 'Sin capo'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {savedSuggestions.length > 0 && (
                  <Text style={styles.savedSuggestionHint}>
                    Mantén presionado para eliminar
                  </Text>
                )}
                {!isAllEasy(currentChords) && !savedCapoActive && (() => {
                  const capoSuggestion = suggestCapo(currentChords);
                  if (!capoSuggestion) {
                    return null;
                  }
                  return (
                    <View style={styles.capoSuggestionRow}>
                      <TouchableOpacity
                        style={styles.capoSuggestion}
                        onPress={() => {
                          setSavedCapoActive(true);
                          setActiveSavedCapo(capoSuggestion.capo);
                          setTransposeOffset(prev => prev - capoSuggestion.capo);
                        }}>
                        <Text style={styles.capoSuggestionText}>
                          Capo {capoSuggestion.capo} → {capoSuggestion.displayChords.join(', ')}
                        </Text>
                        <Text style={styles.capoSuggestionHint}>Toca para aplicar</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </>
            );
          })()}

          {chordProText ? (
            <ScrollView
              contentContainerStyle={styles.chordsContent}
              showsVerticalScrollIndicator={true}>
              {(() => {
                const parsed = parseChordPro(chordProText, transposeOffset);
                const metadata = extractMetadata(parsed);
                const displayLines = getDisplayLines(parsed);
                return (
                  <>
                    {metadata.title && (
                      <Text style={styles.chordProTitle}>
                        {metadata.title}
                      </Text>
                    )}
                    {metadata.subtitle && (
                      <Text style={styles.chordProSubtitle}>
                        {metadata.subtitle}
                      </Text>
                    )}
                    {(metadata.title || metadata.subtitle) && (
                      <View style={styles.chordProDivider} />
                    )}
                    {displayLines.map((line, i) => (
                      <ChordProLineView key={i} line={line} />
                    ))}
                  </>
                );
              })()}
            </ScrollView>
          ) : (
            <ScrollView
              contentContainerStyle={styles.chordsContent}
              showsVerticalScrollIndicator={true}>
              <Text style={styles.chordsText}>
                No hay acordes disponibles para este canto.
              </Text>
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal
        visible={showNote}
        animationType="slide"
        onRequestClose={() => setShowNote(false)}>
        <KeyboardAvoidingView
          style={styles.noteContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.noteHeader}>
            <TouchableOpacity
              onPress={() => setShowNote(false)}
              style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.noteTitle} numberOfLines={1}>
              Nota — {songName}
            </Text>
            <TouchableOpacity onPress={handleSaveNote} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="Escribe tu nota aquí..."
            placeholderTextColor={COLORS.textSecondary}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showSaveInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveInput(false)}>
        <View style={styles.saveInputOverlay}>
          <View style={styles.saveInputContainer}>
            <Text style={styles.saveInputLabel}>Nombre de la sugerencia</Text>
            <TextInput
              style={styles.saveInput}
              placeholder="Ej: Versión grave"
              placeholderTextColor="#999999"
              value={newSuggestionName}
              onChangeText={setNewSuggestionName}
              autoFocus
            />
            <View style={styles.saveInputButtons}>
              <TouchableOpacity
                style={styles.saveInputCancel}
                onPress={() => {
                  setShowSaveInput(false);
                  setNewSuggestionName('');
                }}>
                <Text style={styles.saveInputCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveInputConfirm}
                onPress={handleSaveCapoSuggestion}>
                <Text style={styles.saveInputConfirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ChordProLineView: React.FC<{line: ChordProParsedLine}> = ({line}) => {
  if (line.type === 'empty') {
    return <View style={styles.chordProEmptyLine} />;
  }

  if (line.type === 'plain') {
    return (
      <Text style={styles.chordProPlainText}>{line.text}</Text>
    );
  }

  if (line.type === 'chordpro') {
    const chordChars = new Array(line.lyricLine.length).fill(' ');
    for (const cp of line.chordPositions) {
      for (let i = 0; i < cp.chord.length && cp.position + i < chordChars.length; i++) {
        chordChars[cp.position + i] = cp.chord[i];
      }
    }
    const chordDisplay = chordChars.join('').trimEnd();

    return (
      <Text style={styles.chordProBoth}>
        <Text style={styles.chordProChord}>{chordDisplay}</Text>
        {'\n'}
        <Text style={styles.chordProLyric}>{line.lyricLine}</Text>
      </Text>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  pageInfo: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: '700',
  },
  noteDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
  },
  notePreviewCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notePreviewLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  notePreviewText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '700',
  },
  pdf: {
    flex: 1,
    width: '100%',
  },
  pdfHidden: {
    opacity: 0,
  },
  chordsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chordsTitle: {
    flex: 1,
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  transposeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  transposeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transposeButtonText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  transposeReset: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  transposeLabel: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  capoSuggestion: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0E4FF',
  },
  capoSuggestionText: {
    color: '#1A73E8',
    fontSize: 13,
    fontWeight: '600',
  },
  capoSuggestionHint: {
    color: '#5F9AE8',
    fontSize: 11,
    marginTop: 2,
  },
  chordsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  chordsText: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  noteContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noteTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
  noteInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    padding: 20,
    textAlignVertical: 'top',
  },
  chordProTitle: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  chordProSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  chordProDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  chordProEmptyLine: {
    height: 14,
  },
  chordProPlainText: {
    color: '#000000',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  chordProBoth: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  chordProChord: {
    color: '#FF6D00',
  },
  chordProLyric: {
    color: '#000000',
  },
  capoIndicator: {
    color: '#1A73E8',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  originalButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
  },
  originalButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  capoSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  saveSuggestionContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  saveSuggestionButton: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  saveSuggestionButtonText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '600',
  },
  savedSuggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  savedSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    gap: 6,
  },
  savedSuggestionChipText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  savedSuggestionCapo: {
    color: '#558B2F',
    fontSize: 11,
    fontWeight: '500',
  },
  savedSuggestionHint: {
    color: '#999999',
    fontSize: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  saveInputOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 32,
    width: 300,
  },
  saveInputLabel: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  saveInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#000000',
    fontSize: 14,
    marginBottom: 16,
  },
  saveInputButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  saveInputCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveInputCancelText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  saveInputConfirm: {
    backgroundColor: '#1A73E8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveInputConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
