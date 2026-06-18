import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS} from '../constants/theme';

interface BarreInfo {
  fret: number;
  from: number;
  to: number;
}

interface ChordDiagramProps {
  name: string;
  frets: number[];
  stringCount?: number;
}

export const ChordDiagram: React.FC<ChordDiagramProps> = ({
  name,
  frets,
  stringCount = 6,
}) => {
  const gridWidth = 70;
  const gridHeight = 65;
  const stringSpacing = gridWidth / (stringCount - 1);
  const fretSpacing = gridHeight / 5;
  const markerY = -18;

  const activeFretsList = frets.filter(f => f > 0);
  const minFret = activeFretsList.length > 0 ? Math.min(...activeFretsList) : 0;
  const maxFret = activeFretsList.length > 0 ? Math.max(...activeFretsList) : 0;

  const gridStart = maxFret <= 5 ? 0 : maxFret - 5;

  const showFretNum = minFret > 1;
  const fretNumValue = minFret;

  const barres: BarreInfo[] = (() => {
    const activeFrets = frets
      .map((f, i) => (f > 0 ? {fret: f, index: i} : null))
      .filter((x): x is {fret: number; index: number} => x !== null);
    if (activeFrets.length === 0) return [];
    const minF = Math.min(...activeFrets.map(f => f.fret));
    const barreIndices = activeFrets
      .filter(f => f.fret === minF)
      .map(f => f.index);
    if (barreIndices.length < 2) return [];

    const from = barreIndices[0];
    const to = barreIndices[barreIndices.length - 1];

    if (stringCount === 5) {
      if (barreIndices.length < 4) return [];
    } else {
      if (to - from < 3) return [];
      const hasHigher = frets.some((f, i) => i > from && i < to && f > minF);
      if (!hasHigher) return [];
    }

    return [{fret: minF, from, to}];
  })();

  const barreStrings = new Set(
    barres.flatMap(b => {
      const indices: number[] = [];
      for (let i = b.from; i <= b.to; i++) {
        if (frets[i] === b.fret) {
          indices.push(i);
        }
      }
      return indices;
    }),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.chordName}>{name}</Text>
      <View style={styles.diagramWrapper}>
        <View style={[styles.grid, {width: gridWidth, height: gridHeight}]}>
          {/* Top markers (X / O) */}
          {frets.map((fret, i) => {
            const x = i * stringSpacing;
            if (fret === -1) {
              return (
                <Text
                  key={`marker-${i}`}
                  style={[styles.mutedMarker, {left: x - 4, top: markerY}]}>
                  x
                </Text>
              );
            }
            if (fret === 0) {
              return (
                <View
                  key={`marker-${i}`}
                  style={[styles.openMarker, {left: x - 4, top: markerY + 2}]}
                />
              );
            }
            return null;
          })}

          {/* Strings */}
          {Array.from({length: stringCount}).map((_, i) => (
            <View
              key={`string-${i}`}
              style={[
                styles.stringLine,
                {left: i * stringSpacing, top: 0, height: gridHeight},
              ]}
            />
          ))}

          {/* Frets */}
          {Array.from({length: 6}).map((_, i) => (
            <View
              key={`fret-${i}`}
              style={[
                styles.fretLine,
                gridStart === 0 && i === 0 && styles.nut,
                {top: i * fretSpacing, width: gridWidth},
              ]}
            />
          ))}

          {/* Barre lines */}
          {barres.map((b, i) => {
            const y = (b.fret - gridStart - 0.5) * fretSpacing;
            const x1 = b.from * stringSpacing;
            const x2 = b.to * stringSpacing;
            return (
              <View
                key={`barre-${i}`}
                style={[
                  styles.barre,
                  {
                    left: x1 - 5,
                    top: y - 5,
                    width: x2 - x1 + 10,
                    height: 10,
                  },
                ]}
              />
            );
          })}

          {/* Dots (skip if part of barre) */}
          {frets.map((fret, i) => {
            if (fret <= 0 || barreStrings.has(i)) return null;
            const x = i * stringSpacing;
            const y = (fret - gridStart - 0.5) * fretSpacing;
            return (
              <View
                key={`dot-${i}`}
                style={[styles.dot, {left: x - 6, top: y - 6}]}
              />
            );
          })}
        </View>

        {/* Fret number */}
        {showFretNum && (
          <Text style={[styles.fretNum, {left: +7, top: (minFret - gridStart - 0.5) * fretSpacing - 5}]}>
            {fretNumValue}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 8,
    minWidth: 90,
  },
  chordName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 24,
  },
  diagramWrapper: {
    position: 'relative',
    paddingLeft: 20,
  },
  grid: {
    position: 'relative',
  },
  stringLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: COLORS.textSecondary,
  },
  fretLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: COLORS.textSecondary,
  },
  nut: {
    height: 3,
    backgroundColor: COLORS.text,
  },
  barre: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
    borderRadius: 5,
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
  mutedMarker: {
    position: 'absolute',
    color: COLORS.error,
    fontSize: 11,
    fontWeight: '700',
    width: 9,
    textAlign: 'center',
  },
  openMarker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  fretNum: {
    position: 'absolute',
    color: COLORS.textSecondary,
    fontSize: 10,
  },
});
