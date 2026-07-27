/**
 * CentsIndicator.tsx - Indicador numérico de cents del afinador
 *
 * Componente simple que muestra la desviación de cents como número
 * con signo (+/-) y color dinámico según la afinación.
 *
 * Formato: "+5 cents" o "-3 cents" o "0 cents"
 * Color: verde si está dentro de tolerancia, naranja/rojo si no.
 *
 * Usado en: MainScreen.tsx (debajo del dial del afinador)
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {FONTS} from '../constants/theme';
import {getCentsColor} from '../utils/tunerUtils';

/** Props del indicador de cents */
interface CentsIndicatorProps {
  cents: number;       // Desviación en cents a mostrar
  isTuned?: boolean;   // Si está afinado (cambia color a verde brillante)
  tolerance?: number;  // Tolerancia en cents (default 10)
}

/**
 * Indicador numérico de desviación en cents.
 * Muestra el valor con signo y color según la afinación.
 */
export const CentsIndicator: React.FC<CentsIndicatorProps> = ({cents, isTuned, tolerance = 10}) => {
  const color = getCentsColor(cents, isTuned, tolerance);
  const sign = cents > 0 ? '+' : '';

  return (
    <View style={styles.container}>
      <Text style={[styles.centsValue, {color}]}>
        {sign}
        {Math.round(cents)} cents
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 8,
  },
  centsValue: {
    ...FONTS.cents,
  },
});
