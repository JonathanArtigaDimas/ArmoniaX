/**
 * TunerDial.tsx - Dial animado del afinador con aguja semicircular
 *
 * Componente visual que muestra la desviación de cents como una aguja
 * que se mueve sobre un arco semicircular.
 *
 * Características:
 * - Aguja animada con Animated.spring (suave y con rebote)
 * - Arco con marcas de escala (♭♭, ♭, ✓, ♯, ♯♯)
 * - Punto central que cambia de color según afinación
 * - Ticks de referencia en posiciones clave
 *
 * Rango visual: -50 a +50 cents (se puede configurar)
 * Ángulo de la aguja: -90° (izq) a +90° (der)
 *
 * Usado en: MainScreen.tsx (pantalla del afinador)
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, Animated, StyleSheet} from 'react-native';
import {COLORS} from '../constants/theme';
import {getCentsColor} from '../utils/tunerUtils';

/** Props del dial del afinador */
interface TunerDialProps {
  cents: number;        // Desviación actual en cents
  minCents?: number;    // Límite inferior del arco (default -50)
  maxCents?: number;    // Límite superior del arco (default +50)
  isTuned?: boolean;    // Si está afinado
  tolerance?: number;   // Tolerancia para colores (default 10)
}

/** Ángulo de la aguja en la posición más a la izquierda (♭♭) */
const NEEDLE_MIN_ANGLE = -90;
/** Ángulo de la aguja en la posición más a la derecha (♯♯) */
const NEEDLE_MAX_ANGLE = 90;

/**
 * Dial visual del afinador con aguja animada.
 * La aguja se mueve suavemente usando Animated.spring.
 */
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
