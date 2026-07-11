import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {FONTS} from '../constants/theme';
import {getCentsColor} from '../utils/tunerUtils';

interface CentsIndicatorProps {
  cents: number;
  isTuned?: boolean;
  tolerance?: number;
}

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
