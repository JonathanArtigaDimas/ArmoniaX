import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  NativeEventEmitter,
  NativeModules,
  Switch,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {INSTRUMENTS, Instrument, Note, getNoteName} from '../constants/instruments';
import {InstrumentSelector} from '../components/InstrumentSelector';
import {NoteDisplay} from '../components/NoteDisplay';
import {TunerDial} from '../components/TunerDial';
import {CentsIndicator} from '../components/CentsIndicator';
import {COLORS} from '../constants/theme';
import {initSounds, playTunedSound} from '../utils/metronomeSound';
import {centsFromFreq} from '../utils/tunerUtils';
import {useSettings} from '../contexts/SettingsContext';

const {AudioResolver} = NativeModules;
const emitter = AudioResolver ? new NativeEventEmitter(AudioResolver) : null;

interface StringDef {
  name: string;
  frequency: number;
  minHz: number;
  maxHz: number;
}

const GUITAR_STRINGS: StringDef[] = [
  {name: 'E2', frequency: 82.4, minHz: 55, maxHz: 115},
  {name: 'A2', frequency: 110.0, minHz: 80, maxHz: 145},
  {name: 'D3', frequency: 146.8, minHz: 115, maxHz: 185},
  {name: 'G3', frequency: 196.0, minHz: 160, maxHz: 240},
  {name: 'B3', frequency: 246.9, minHz: 210, maxHz: 295},
  {name: 'E4', frequency: 329.6, minHz: 280, maxHz: 380},
];

const CHARANGO_STRINGS: StringDef[] = [
  {name: 'E4', frequency: 329.6, minHz: 280, maxHz: 380},
  {name: 'A4', frequency: 440.0, minHz: 380, maxHz: 500},
  {name: 'E5', frequency: 659.3, minHz: 580, maxHz: 740},
  {name: 'C5', frequency: 523.3, minHz: 460, maxHz: 590},
  {name: 'G4', frequency: 392.0, minHz: 330, maxHz: 450},
];

const STABILITY_MARGIN_RATIO = 0.01;
const STABILITY_FRAMES = 3;

function getStringsForInstrument(instrumentId: string): StringDef[] {
  return instrumentId === 'charango' ? CHARANGO_STRINGS : GUITAR_STRINGS;
}

function getAutoRangeForInstrument(instrumentId: string): {min: number; max: number} {
  return instrumentId === 'charango'
    ? {min: 280.0, max: 700.0}
    : {min: 70.0, max: 400.0};
}

export const AfinadorScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {proPrecision, referenceHz, notationSystem} = useSettings();
  const [selectedInstrument, setSelectedInstrument] =
    useState<Instrument>(INSTRUMENTS[0]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [cents, setCents] = useState(0);
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [isTuned, setIsTuned] = useState(false);
  const [detectedHz, setDetectedHz] = useState(0);
  const [autoMode, setAutoMode] = useState(true);

  const tunedTolerance = proPrecision ? 3 : 10;

  const freqHistoryRef = useRef<number[]>([]);
  const stableCandidateRef = useRef<{index: number; cents: number} | null>(null);
  const stableCountRef = useRef(0);
  const wasTunedRef = useRef(false);
  const tunedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentNote: Note = selectedInstrument.notes[currentNoteIndex];
  const activeStrings = getStringsForInstrument(selectedInstrument.id);

  const resetState = useCallback(() => {
    setIsTuned(false);
    setDetectedHz(0);
    setCents(0);
    freqHistoryRef.current = [];
    stableCandidateRef.current = null;
    stableCountRef.current = 0;
    wasTunedRef.current = false;
  }, []);

  useEffect(() => {
    initSounds();
    return () => {
      if (tunedTimeoutRef.current) {
        clearTimeout(tunedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isTuned && !wasTunedRef.current) {
      playTunedSound();
      wasTunedRef.current = true;
      if (tunedTimeoutRef.current) {
        clearTimeout(tunedTimeoutRef.current);
      }
      tunedTimeoutRef.current = setTimeout(() => {
        wasTunedRef.current = false;
      }, 600);
    } else if (!isTuned) {
      if (tunedTimeoutRef.current) {
        clearTimeout(tunedTimeoutRef.current);
      }
      wasTunedRef.current = false;
    }
  }, [isTuned]);

  const handleStringSelect = useCallback(
    (index: number) => {
      const s = activeStrings[index];
      setSelectedString(index);
      setAutoMode(false);
      resetState();
      AudioResolver?.setTargetFrequencyRange(s.minHz, s.maxHz);
    },
    [activeStrings, resetState],
  );

  const handleAutoModeToggle = useCallback(
    (value: boolean) => {
      setAutoMode(value);
      setSelectedString(null);
      resetState();

      if (value) {
        const range = getAutoRangeForInstrument(selectedInstrument.id);
        AudioResolver?.setTargetFrequencyRange(range.min, range.max);
      }
    },
    [selectedInstrument.id, resetState],
  );

  useFocusEffect(
    useCallback(() => {
      if (autoMode && selectedString === null) {
        const range = getAutoRangeForInstrument(selectedInstrument.id);
        AudioResolver?.setTargetFrequencyRange(range.min, range.max);
      }

      AudioResolver?.startListening();

      const subscription = emitter?.addListener(
        'onFrequencyDetected',
        (freq: number) => {
          if (freq <= 0) return;
          setDetectedHz(freq);

          if (selectedString !== null) {
            const strings = getStringsForInstrument(selectedInstrument.id);
            const target = strings[selectedString];
            const adjustedFreq = target.frequency * (referenceHz / 440);
            const clampedCents = centsFromFreq(freq, adjustedFreq);
            const tuned = Math.abs(clampedCents) <= tunedTolerance;

            setIsTuned(tuned);
            setCents(clampedCents);

            setCurrentNoteIndex(
              selectedInstrument.notes.findIndex(n => n.name === target.name),
            );
          } else if (autoMode) {
            const history = freqHistoryRef.current;
            history.push(freq);
            if (history.length > STABILITY_FRAMES) {
              history.shift();
            }

            if (history.length >= STABILITY_FRAMES) {
              const stabilityMargin = freq * STABILITY_MARGIN_RATIO;
              const isStable = history.every(
                h => Math.abs(h - freq) <= stabilityMargin,
              );

              if (isStable) {
                const {index, cents: c, effectiveFreq: ef} = findClosestNote(
                  freq,
                  selectedInstrument.notes,
                  referenceHz,
                );
                const current = stableCandidateRef.current;

                if (current && current.index === index) {
                  stableCountRef.current++;
                } else {
                  stableCandidateRef.current = {index, cents: c};
                  stableCountRef.current = 1;
                }

                if (stableCountRef.current >= STABILITY_FRAMES) {
                  setCurrentNoteIndex(index);
                  const adjustedFreq = selectedInstrument.notes[index].frequency * (referenceHz / 440);
                  const clampedC = centsFromFreq(ef, adjustedFreq);
                  const tuned = Math.abs(clampedC) <= tunedTolerance;
                  setCents(clampedC);
                  setIsTuned(tuned);
                }
              }
            }
          } else {
            const {index, cents: c} = findClosestNote(
              freq,
              selectedInstrument.notes,
              referenceHz,
            );
            setCurrentNoteIndex(index);
            setCents(c);
            setIsTuned(Math.abs(c) <= tunedTolerance);
          }
        },
      );

      return () => {
        subscription?.remove();
        AudioResolver?.stopListening();
        resetState();
      };
    }, [selectedInstrument, selectedString, autoMode, tunedTolerance, referenceHz, resetState]),
  );

  const handleInstrumentSelect = (instrument: Instrument) => {
    setSelectedInstrument(instrument);
    setCurrentNoteIndex(0);
    setSelectedString(null);
    resetState();
    const range = getAutoRangeForInstrument(instrument.id);
    AudioResolver?.setTargetFrequencyRange(range.min, range.max);
  };

  const handlePrevNote = () => {
    const newIndex =
      (currentNoteIndex - 1 + selectedInstrument.notes.length) %
      selectedInstrument.notes.length;
    setCurrentNoteIndex(newIndex);
    setSelectedString(null);
    resetState();
  };

  const handleNextNote = () => {
    const newIndex =
      (currentNoteIndex + 1) % selectedInstrument.notes.length;
    setCurrentNoteIndex(newIndex);
    setSelectedString(null);
    resetState();
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <InstrumentSelector
          instruments={INSTRUMENTS}
          selectedId={selectedInstrument.id}
          onSelect={handleInstrumentSelect}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.noteSection}>
          <TouchableOpacity onPress={handlePrevNote} style={styles.navButton} accessibilityLabel="Nota anterior" accessibilityRole="button">
            <Text style={styles.navButtonText}>◀</Text>
          </TouchableOpacity>

          <NoteDisplay
            note={currentNote}
            isTuned={isTuned}
            detectedHz={detectedHz}
            cents={cents}
            tolerance={tunedTolerance}
            notationSystem={notationSystem}
          />

          <TouchableOpacity onPress={handleNextNote} style={styles.navButton} accessibilityLabel="Siguiente nota" accessibilityRole="button">
            <Text style={styles.navButtonText}>▶</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dialSection}>
          <TunerDial cents={cents} isTuned={isTuned} tolerance={tunedTolerance} />
        </View>

        <CentsIndicator cents={cents} isTuned={isTuned} tolerance={tunedTolerance} />

        <View style={styles.autoSection}>
          <Text style={styles.autoLabel}>Modo Automático</Text>
          <Switch
            value={autoMode}
            onValueChange={handleAutoModeToggle}
            trackColor={{false: COLORS.surface, true: COLORS.surfaceActive}}
            thumbColor={autoMode ? COLORS.accent : COLORS.textSecondary}
          />
        </View>
      </View>

      <View style={styles.stringSection}>
        <Text style={styles.stringTitle}>Cuerda</Text>
        <View style={styles.stringRow}>
          {activeStrings.map((s, i) => {
            const isActive = selectedString === i;
            return (
              <TouchableOpacity
                key={s.name}
                style={[
                  styles.stringButton,
                  isActive && styles.stringButtonActive,
                  isTuned && isActive && styles.stringButtonTuned,
                ]}
                onPress={() => handleStringSelect(i)}
                accessibilityLabel={`Cuerda ${getNoteName(s.name, notationSystem)}`}
                accessibilityRole="button"
                accessibilityState={{selected: isActive}}>
                <Text
                  style={[
                    styles.stringButtonText,
                    isActive && styles.stringButtonTextActive,
                    isTuned && isActive && styles.stringButtonTextTuned,
                  ]}>
                   {getNoteName(s.name, notationSystem)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

function findClosestNote(
  frequency: number,
  notes: Note[],
  refHz: number = 440,
): {index: number; cents: number; effectiveFreq: number} {
  let closestIndex = 0;
  let minCents = Infinity;
  let harmonicDetected = false;

  notes.forEach((note, i) => {
    const adjustedFreq = note.frequency * (refHz / 440);
    const ratio = frequency / adjustedFreq;
    const centsVal = 1200 * Math.log2(ratio);
    if (Math.abs(centsVal) < Math.abs(minCents)) {
      minCents = centsVal;
      closestIndex = i;
    }
  });

  // Harmonic detection: if freq/2 matches a known note within 20 cents
  // and the direct match has > 200 cents deviation, prefer the lower octave.
  // Fixes G3 (196 Hz) detected as E4 when YIN picks up the 2nd harmonic (392 Hz).
  // Thresholds are conservative to avoid false triggers on E4, B3, etc.
  if (Math.abs(minCents) > 200) {
    const halfFreq = frequency / 2;
    let bestHarmonicIndex = -1;
    let bestHarmonicCents = Infinity;

    notes.forEach((note, i) => {
      const adjustedFreq = note.frequency * (refHz / 440);
      const ratio = halfFreq / adjustedFreq;
      const centsVal = 1200 * Math.log2(ratio);
      if (Math.abs(centsVal) < Math.abs(bestHarmonicCents)) {
        bestHarmonicCents = centsVal;
        bestHarmonicIndex = i;
      }
    });

    if (bestHarmonicIndex >= 0 && Math.abs(bestHarmonicCents) < 20) {
      closestIndex = bestHarmonicIndex;
      harmonicDetected = true;
    }
  }

  const effectiveFreq = harmonicDetected ? frequency / 2 : frequency;
  const adjustedFreq = notes[closestIndex].frequency * (refHz / 440);
  const ratio = effectiveFreq / adjustedFreq;
  const cents = Math.round(1200 * Math.log2(ratio));

  return {index: closestIndex, cents: Math.max(-1000, Math.min(1000, cents)), effectiveFreq};
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    padding: 16,
  },
  navButtonText: {
    color: COLORS.textSecondary,
    fontSize: 28,
  },
  dialSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  autoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  autoLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  stringSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stringTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  stringRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  stringButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  stringButtonActive: {
    backgroundColor: COLORS.surfaceActive,
    borderColor: COLORS.accent,
  },
  stringButtonTuned: {
    backgroundColor: COLORS.accentDark,
    borderColor: '#00FF88',
  },
  stringButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  stringButtonTextActive: {
    color: COLORS.accent,
  },
  stringButtonTextTuned: {
    color: '#00FF88',
  },
});
