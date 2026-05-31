import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamilies, Radii } from '../../theme/tokens';
import { kes } from '../../utils/money';

export interface ChartEntry { key: string; label: string; emoji: string; value: number; color: string; }

export function BarChart({ data }: { data: ChartEntry[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={styles.container}>
      {data.map(d => (
        <View key={d.key} style={styles.row}>
          <View style={styles.labelRow}>
            <Text style={styles.emoji}>{d.emoji}</Text>
            <Text style={styles.label}>{d.label}</Text>
            <Text style={styles.value}>Ksh {kes(d.value)}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(d.value / max) * 100}%` as any, backgroundColor: d.color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14, marginTop: 4 },
  row: {},
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  emoji: { fontSize: 14, marginRight: 6, width: 20 },
  label: { fontFamily: FontFamilies.semiBold, fontSize: 13.5, color: Colors.ink, flex: 1 },
  value: { fontFamily: FontFamilies.display, fontSize: 13.5, color: Colors.ink },
  track: { height: 12, backgroundColor: Colors.surface2, borderRadius: Radii.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radii.pill },
});
