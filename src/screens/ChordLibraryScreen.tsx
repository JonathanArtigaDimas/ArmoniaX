import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {COLORS} from '../constants/theme';
import {ChordDiagram} from '../components/ChordDiagram';
import {GUITAR_CHORD_GROUPS} from '../data/guitarChords';
import {CHARANGO_CHORD_GROUPS} from '../data/charangoChords';
import {ChordGroup} from '../data/chordTypes';

interface ChordLibraryScreenProps {
  onClose: () => void;
}

type Instrument = 'guitarra' | 'charango';

export const ChordLibraryScreen: React.FC<ChordLibraryScreenProps> = ({
  onClose,
}) => {
  const [instrument, setInstrument] = useState<Instrument>('guitarra');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['Mayores']),
  );

  const groups: ChordGroup[] =
    instrument === 'guitarra' ? GUITAR_CHORD_GROUPS : CHARANGO_CHORD_GROUPS;
  const stringCount = instrument === 'guitarra' ? 6 : 5;

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Cerrar biblioteca" accessibilityRole="button">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Biblioteca de Acordes</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.instrumentBar}>
        <TouchableOpacity
          style={[
            styles.instrumentButton,
            instrument === 'guitarra' && styles.instrumentButtonActive,
          ]}
          onPress={() => {
            setInstrument('guitarra');
            setExpandedGroups(new Set(['Mayores']));
          }}
          accessibilityLabel="Guitarra"
          accessibilityRole="button"
          accessibilityState={{selected: instrument === 'guitarra'}}>
          <Text
            style={[
              styles.instrumentButtonText,
              instrument === 'guitarra' && styles.instrumentButtonTextActive,
            ]}>
            Guitarra
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.instrumentButton,
            instrument === 'charango' && styles.instrumentButtonActive,
          ]}
          onPress={() => {
            setInstrument('charango');
            setExpandedGroups(new Set(['Mayores']));
          }}
          accessibilityLabel="Charango"
          accessibilityRole="button"
          accessibilityState={{selected: instrument === 'charango'}}>
          <Text
            style={[
              styles.instrumentButtonText,
              instrument === 'charango' && styles.instrumentButtonTextActive,
            ]}>
            Charango
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}>
        {groups.map(group => {
          const isExpanded = expandedGroups.has(group.title);
          return (
            <View key={group.title} style={styles.group}>
              <TouchableOpacity
                style={styles.groupHeader}
                onPress={() => toggleGroup(group.title)}
                activeOpacity={0.7}
                accessibilityLabel={`${group.title}, ${isExpanded ? 'expandido' : 'colapsado'}`}
                accessibilityRole="button"
                accessibilityState={{expanded: isExpanded}}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <Text style={styles.groupArrow}>{isExpanded ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.chordGrid}>
                  {group.chords.map(chord => (
                    <ChordDiagram
                      key={chord.name}
                      name={chord.label}
                      frets={chord.frets}
                      stringCount={stringCount}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  instrumentBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  instrumentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instrumentButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  instrumentButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  instrumentButtonTextActive: {
    color: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  group: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  groupTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  groupArrow: {
    color: COLORS.accent,
    fontSize: 14,
  },
  chordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 12,
    paddingHorizontal: 4,
  },
});
