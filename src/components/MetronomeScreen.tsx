import React, {useState, useRef, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {COLORS} from '../constants/theme';
import {initSounds, playTick, cleanupSounds} from '../utils/metronomeSound';

const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8'];

const getBeatsFromSignature = (sig: string): number => {
  return parseInt(sig.split('/')[0], 10);
};

interface MetronomeScreenProps {
  onClose: () => void;
}

export const MetronomeScreen: React.FC<MetronomeScreenProps> = ({onClose}) => {
  const insets = useSafeAreaInsets();
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackLayoutRef = useRef({x: 0, width: 0});

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const {x, width} = trackLayoutRef.current;
        if (width <= 0) return;
        const relativeX = gestureState.moveX - x;
        const ratio = Math.max(0, Math.min(1, relativeX / width));
        const newBpm = Math.round(20 + ratio * 280);
        setBpm(newBpm);
      },
      onPanResponderRelease: () => {},
    }),
  ).current;

  const beats = getBeatsFromSignature(timeSignature);
  const beatInterval = (60 / bpm) * 1000;

  useEffect(() => {
    initSounds();
    return () => {
      stopMetronome();
      cleanupSounds();
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startMetronome();
    } else {
      stopMetronome();
    }
    return () => stopMetronome();
  }, [isPlaying, bpm, timeSignature]);

  const startMetronome = () => {
    stopMetronome();
    setCurrentBeat(0);

    intervalRef.current = setInterval(() => {
      setCurrentBeat(prev => {
        const nextBeat = (prev % beats) + 1;
        const isAccent = nextBeat === 1;

        playTick(isAccent);

        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();

        return nextBeat;
      });
    }, beatInterval);
  };

  const stopMetronome = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentBeat(0);
  };

  const handleBpmChange = (delta: number) => {
    setBpm(prev => Math.max(20, Math.min(300, prev + delta)));
  };

  const adjustBpm = (target: number) => {
    setBpm(Math.max(20, Math.min(300, target)));
  };

  const tempoPresets = [
    {name: 'Largo', bpm: 50},
    {name: 'Adagio', bpm: 66},
    {name: 'Andante', bpm: 80},
    {name: 'Moderato', bpm: 100},
    {name: 'Allegro', bpm: 120},
    {name: 'Presto', bpm: 160},
    {name: 'Prestissimo', bpm: 200},
  ];

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Metrónomo</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.mainContent}>
        <View style={styles.bpmContainer}>
          <TouchableOpacity
            style={styles.bpmAdjustButton}
            onPress={() => handleBpmChange(-1)}>
            <Text style={styles.bpmAdjustText}>−</Text>
          </TouchableOpacity>

          <View style={styles.bpmDisplay}>
            <Animated.Text style={[styles.bpmValue, {transform: [{scale: pulseAnim}]}]}>
              {bpm}
            </Animated.Text>
            <Text style={styles.bpmLabel}>BPM</Text>
          </View>

          <TouchableOpacity
            style={styles.bpmAdjustButton}
            onPress={() => handleBpmChange(1)}>
            <Text style={styles.bpmAdjustText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.beatsContainer}>
          {Array.from({length: beats}, (_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.beatDot,
                i === 0 && styles.beatDotAccent,
                currentBeat === i + 1 && styles.beatDotActive,
                currentBeat === i + 1 && {transform: [{scale: pulseAnim}]},
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
          onPress={() => setIsPlaying(!isPlaying)}>
          <Text style={styles.playButtonText}>{isPlaying ? '■' : '▶'}</Text>
        </TouchableOpacity>

        <View style={styles.signatureContainer}>
          <Text style={styles.signatureLabel}>Compás</Text>
          <View style={styles.signatureRow}>
            {TIME_SIGNATURES.map(sig => (
              <TouchableOpacity
                key={sig}
                style={[
                  styles.signatureButton,
                  timeSignature === sig && styles.signatureButtonActive,
                ]}
                onPress={() => setTimeSignature(sig)}>
                <Text
                  style={[
                    styles.signatureButtonText,
                    timeSignature === sig && styles.signatureButtonTextActive,
                  ]}>
                  {sig}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Tempo</Text>
          <View
            style={styles.sliderTrack}
            onLayout={e => {
              const {x, width} = e.nativeEvent.layout;
              trackLayoutRef.current = {x, width};
            }}>
            <View style={[styles.sliderFill, {width: `${((bpm - 20) / 280) * 100}%`}]} />
            <View
              {...panResponder.panHandlers}
              style={[styles.sliderThumb, {left: `${((bpm - 20) / 280) * 100}%`}]}
            />
          </View>
          <View style={styles.sliderMarks}>
            <Text style={styles.sliderMark}>20</Text>
            <Text style={styles.sliderMark}>160</Text>
            <Text style={styles.sliderMark}>300</Text>
          </View>
        </View>

        <View style={styles.presetsContainer}>
          <Text style={styles.presetsLabel}>Tempo presets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsGrid}>
            {tempoPresets.map(preset => (
              <TouchableOpacity
                key={preset.name}
                style={[
                  styles.presetButton,
                  bpm === preset.bpm && styles.presetButtonActive,
                ]}
                onPress={() => adjustBpm(preset.bpm)}>
                <Text
                  style={[
                    styles.presetName,
                    bpm === preset.bpm && styles.presetNameActive,
                  ]}>
                  {preset.name}
                </Text>
                <Text
                  style={[
                    styles.presetBpm,
                    bpm === preset.bpm && styles.presetBpmActive,
                  ]}>
                  {preset.bpm}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
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
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  bpmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  bpmAdjustButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bpmAdjustText: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: '600',
  },
  bpmDisplay: {
    alignItems: 'center',
    marginHorizontal: 40,
  },
  bpmValue: {
    color: COLORS.text,
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: -2,
  },
  bpmLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  beatsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  beatDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  beatDotAccent: {
    borderColor: COLORS.warning,
  },
  beatDotActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: COLORS.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonActive: {
    backgroundColor: COLORS.error,
  },
  playButtonText: {
    color: COLORS.text,
    fontSize: 28,
  },
  signatureContainer: {
    width: '100%',
    marginBottom: 24,
  },
  signatureLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  signatureButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signatureButtonActive: {
    backgroundColor: '#1A3D2A',
    borderColor: COLORS.accent,
  },
  signatureButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  signatureButtonTextActive: {
    color: COLORS.accent,
  },
  sliderContainer: {
    width: '100%',
    marginBottom: 32,
  },
  sliderLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    borderWidth: 3,
    borderColor: COLORS.background,
    transform: [{translateX: -14}],
  },
  sliderMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderMark: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  presetsContainer: {
    width: '100%',
  },
  presetsLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  presetsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  presetButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: '#1A3D2A',
    borderColor: COLORS.accent,
  },
  presetName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  presetNameActive: {
    color: COLORS.accent,
  },
  presetBpm: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  presetBpmActive: {
    color: COLORS.accent,
  },
});
