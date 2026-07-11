import React, {useEffect, useRef} from 'react';
import {View, Text, Animated, StyleSheet} from 'react-native';
import {COLORS} from '../constants/theme';
import {getCentsColor} from '../utils/tunerUtils';

interface TunerDialProps {
  cents: number;
  minCents?: number;
  maxCents?: number;
  isTuned?: boolean;
  tolerance?: number;
}

const NEEDLE_MIN_ANGLE = -90;
const NEEDLE_MAX_ANGLE = 90;

export const TunerDial: React.FC<TunerDialProps> = ({
  cents,
  minCents = -50,
  maxCents = 50,
  isTuned,
  tolerance = 10,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const clamped = Math.max(minCents, Math.min(maxCents, cents));
    const ratio = (clamped - minCents) / (maxCents - minCents);
    Animated.spring(animatedValue, {
      toValue: ratio,
      useNativeDriver: true,
      damping: 15,
      stiffness: 120,
    }).start();
  }, [cents, minCents, maxCents, animatedValue]);

  const rotation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [`${NEEDLE_MIN_ANGLE}deg`, `${NEEDLE_MAX_ANGLE}deg`],
  });

  const needleColor = getCentsColor(cents, isTuned, tolerance);

  return (
    <View style={styles.container}>
      <View style={styles.arcContainer}>
        <View style={styles.centerTick} />
        <View style={[styles.tick, styles.tickLeft2]} />
        <View style={[styles.tick, styles.tickLeft1]} />
        <View style={[styles.tick, styles.tickRight1]} />
        <View style={[styles.tick, styles.tickRight2]} />

        <View style={styles.labelsContainer}>
          <View style={[styles.labelWrapper, styles.labelLeftOuter]}>
            <Text style={styles.labelText}>♯♯</Text>
          </View>
          <View style={[styles.labelWrapper, styles.labelLeftInner]}>
            <Text style={styles.labelText}>♯</Text>
          </View>
          <View style={[styles.labelWrapper, styles.labelCenter]}>
            <Text style={[styles.labelText, styles.labelTextCenter]}>✓</Text>
          </View>
          <View style={[styles.labelWrapper, styles.labelRightInner]}>
            <Text style={styles.labelText}>♭</Text>
          </View>
          <View style={[styles.labelWrapper, styles.labelRightOuter]}>
            <Text style={styles.labelText}>♭♭</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.needleContainer,
            {transform: [{rotate: rotation}]},
          ]}>
          <View style={[styles.needle, {backgroundColor: needleColor}]} />
        </Animated.View>

        <View
          style={[styles.centerDot, {backgroundColor: needleColor}]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  arcContainer: {
    width: 260,
    height: 140,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  needleContainer: {
    position: 'absolute',
    bottom: 0,
    width: 260,
    height: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  needle: {
    width: 3,
    height: 110,
    borderRadius: 1.5,
  },
  centerDot: {
    position: 'absolute',
    bottom: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  centerTick: {
    position: 'absolute',
    bottom: 0,
    left: 127,
    width: 2,
    height: 20,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 1,
  },
  tick: {
    position: 'absolute',
    bottom: 0,
    width: 2,
    height: 14,
    backgroundColor: COLORS.border,
    borderRadius: 1,
  },
  tickLeft2: {left: 42},
  tickLeft1: {left: 84},
  tickRight1: {right: 84},
  tickRight2: {right: 42},
  labelsContainer: {
    position: 'absolute',
    bottom: 24,
    width: 260,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  labelWrapper: {
    alignItems: 'center',
  },
  labelLeftOuter: {width: 30},
  labelLeftInner: {width: 30},
  labelCenter: {width: 30},
  labelRightInner: {width: 30},
  labelRightOuter: {width: 30},
  labelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  labelTextCenter: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
  },
});
