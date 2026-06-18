import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {COLORS} from '../constants/theme';
import {buscarCantoEnPDF, PDFScanResult} from '../utils/PDFScanner';

interface AddSongScreenProps {
  onClose: () => void;
  onAdd: (name: string, cantoNumber: number, pages: number[]) => void;
}

function parsePagesInput(input: string): number[] | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(s => parseInt(s.trim(), 10));
    if (parts.some(isNaN) || parts.some(p => p <= 0)) {
      return null;
    }
    return [...new Set(parts)].sort((a, b) => a - b);
  }

  if (trimmed.includes('-')) {
    const parts = trimmed.split('-').map(s => parseInt(s.trim(), 10));
    if (parts.length !== 2 || parts.some(isNaN) || parts.some(p => p <= 0)) {
      return null;
    }
    const [start, end] = parts;
    if (start > end) {
      return null;
    }
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  const single = parseInt(trimmed, 10);
  if (isNaN(single) || single <= 0) {
    return null;
  }
  return [single];
}

export const AddSongScreen: React.FC<AddSongScreenProps> = ({
  onClose,
  onAdd,
}) => {
  const [nameText, setNameText] = useState('');
  const [cantoText, setCantoText] = useState('');
  const [pagesText, setPagesText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PDFScanResult[]>([]);
  const [noResults, setNoResults] = useState(false);
  const [basePage, setBasePage] = useState<number>(0);
  const [pageOffset, setPageOffset] = useState(0);

  const parsedPages = parsePagesInput(pagesText);

  const canAdd =
    nameText.trim().length > 0 &&
    !isNaN(parseInt(cantoText, 10)) &&
    parseInt(cantoText, 10) > 0 &&
    parsedPages !== null &&
    parsedPages.length > 0;

  const maxExtraPages = 5;
  const canAddPage = basePage > 0 && pageOffset < maxExtraPages;
  const canRemovePage = basePage > 0 && pageOffset > 0;

  const handleAddPage = () => {
    if (!canAddPage) return;
    const newOffset = pageOffset + 1;
    setPageOffset(newOffset);
    const pages = Array.from({length: newOffset + 1}, (_, i) => basePage + i);
    setPagesText(pages.join(','));
  };

  const handleRemovePage = () => {
    if (!canRemovePage) return;
    const newOffset = pageOffset - 1;
    setPageOffset(newOffset);
    if (newOffset === 0) {
      setPagesText(String(basePage));
    } else {
      const pages = Array.from({length: newOffset + 1}, (_, i) => basePage + i);
      setPagesText(pages.join(','));
    }
  };

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (nameText.trim().length < 2) {
      setSearchResults([]);
      setNoResults(false);
      return;
    }

    setNoResults(false);
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchResults([]);
      try {
        const response = await buscarCantoEnPDF(nameText.trim());
        if (response.status === 'success' && response.results && response.results.length > 0) {
          if (response.results.length === 1) {
            selectResult(response.results[0]);
            setSearchResults([]);
          } else {
            setSearchResults(response.results);
          }
        } else {
          setNoResults(true);
        }
      } catch {
        setNoResults(true);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [nameText]);

  const selectResult = (result: PDFScanResult) => {
    setNameText(result.titulo);
    setCantoText(result.numeroCanto);
    setBasePage(parseInt(result.pagina, 10));
    setPageOffset(0);
    setPagesText(result.pagina);
    setSearchResults([]);
  };

  const handleAdd = () => {
    if (!canAdd) {
      return;
    }
    const name = nameText.trim();
    const cantoNumber = parseInt(cantoText, 10);
    onAdd(name, cantoNumber, parsedPages!);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Agregar canto</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Buscar canto en el PDF</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ej: AMO AL SEÑOR"
            placeholderTextColor={COLORS.textSecondary}
            value={nameText}
            onChangeText={text => {
              setNameText(text);
              setSearchResults([]);
              setNoResults(false);
            }}
            autoFocus
          />
          {searching && (
            <ActivityIndicator size="small" color={COLORS.accent} style={styles.inputSpinner} />
          )}
        </View>

        {noResults && nameText.trim().length >= 2 && (
          <Text style={styles.noResultsText}>No se encontraron resultados</Text>
        )}

        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeader}>
              {searchResults.length} cantos encontrados
            </Text>
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={`${result.numeroCanto}-${index}`}
                style={styles.resultItem}
                onPress={() => selectResult(result)}>
                <Text style={styles.resultTitle} numberOfLines={2}>
                  {result.titulo}
                </Text>
                <Text style={styles.resultNumber}>Canto {result.numeroCanto}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {cantoText.length > 0 && parsedPages && parsedPages.length > 0 && (
          <View style={styles.pagePreview}>
            <View style={styles.pagePreviewHeader}>
              <Text style={styles.pagePreviewIcon}>📄</Text>
              <View style={styles.pagePreviewTexts}>
                {nameText.trim().length > 0 && (
                  <Text style={styles.pagePreviewName} numberOfLines={2}>
                    {nameText.trim()}
                  </Text>
                )}
                <Text style={styles.pagePreviewTitle}>
                  {parsedPages.length === 1
                    ? `Página ${parsedPages[0]}`
                    : `Páginas ${parsedPages[0]}-${parsedPages[parsedPages.length - 1]}`}
                </Text>
              </View>
            </View>
            <Text style={styles.pagePreviewSub}>
              {parsedPages.length === 1
                ? '1 página seleccionada'
                : `${parsedPages.length} páginas seleccionadas`}
            </Text>
            {parsedPages.length > 1 && (
              <Text style={styles.pagePreviewDetail}>
                {parsedPages.join(', ')}
              </Text>
            )}

            {basePage > 0 && (
              <View style={styles.pageAdjustRow}>
                <TouchableOpacity
                  style={[styles.pageAdjustButton, !canRemovePage && styles.pageAdjustButtonDisabled]}
                  onPress={handleRemovePage}
                  disabled={!canRemovePage}>
                  <Text style={styles.pageAdjustButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.pageAdjustLabel}>
                  {pageOffset === 0
                    ? 'Página única'
                    : `+${pageOffset} página${pageOffset > 1 ? 's' : ''}`}
                </Text>
                <TouchableOpacity
                  style={[styles.pageAdjustButton, !canAddPage && styles.pageAdjustButtonDisabled]}
                  onPress={handleAddPage}
                  disabled={!canAddPage}>
                  <Text style={styles.pageAdjustButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
            onPress={handleAdd}
            disabled={!canAdd}>
            <Text style={styles.addText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputSpinner: {
    position: 'absolute',
    right: 16,
  },
  noResultsText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  resultsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: 12,
    marginTop: 8,
  },
  resultsHeader: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  resultItem: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  resultNumber: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  pagePreview: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: 16,
    marginTop: 16,
  },
  pagePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pagePreviewIcon: {
    fontSize: 20,
  },
  pagePreviewTexts: {
    flex: 1,
  },
  pagePreviewName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  pagePreviewTitle: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  pagePreviewSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  pagePreviewDetail: {
    color: COLORS.text,
    fontSize: 13,
    marginTop: 4,
  },
  pageAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  pageAdjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageAdjustButtonDisabled: {
    opacity: 0.3,
  },
  pageAdjustButtonText: {
    color: COLORS.background,
    fontSize: 22,
    fontWeight: '700',
  },
  pageAdjustLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addText: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '700',
  },
});
