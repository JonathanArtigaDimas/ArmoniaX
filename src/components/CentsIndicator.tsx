import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS, FONTS} from '../constants/theme';

interface CentsIndicatorProps {
  cents: number;
  isTuned?: boolean;
  tolerance?: number;
}

const getCentsColor = (cents: number, isTuned?: boolean, tolerance: number = 10): string => {
  if (isTuned) {return '#00FF88';}
  const abs = Math.abs(cents);
  if (abs <= tolerance) {return COLORS.accent;}
  if (abs <= tolerance * 2) {return COLORS.warning;}
  return COLORS.error;
};

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
