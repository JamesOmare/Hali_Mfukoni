import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamilies, Radii } from '../../theme/tokens';
import { kes } from '../../utils/money';
import type { ChartEntry } from './BarChart';

export function FlowChart({ data, total }: { data: ChartEntry[]; total: number }) {
  return (
    <View style={{ marginTop: 6 }}>
      {/* Stacked proportion bar */}
      <View style={styles.stackBar}>
        {data.map(d => (
          <View
            key={d.key}
            style={{ width: `${(d.value / total) * 100}%`, backgroundColor: d.color, minWidth: 3 }}
          />
        ))}
      </View>
      {/* Ranked stream list */}
      <View style={{ marginTop: 14 }}>
        {data.map((d, i) => (
          <View key={d.key} style={[styles.streamRow, i < data.length - 1 && styles.divider]}>
            <Text style={styles.emoji}>{d.emoji}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.streamTop}>
                <Text style={styles.streamLabel}>{d.label}</Text>
                <Text style={styles.streamValue}>Ksh {kes(d.value)}</Text>
              </View>
              <View style={[styles.streamTrack, { marginTop: 6 }]}>
                <View style={[styles.streamFill, { width: `${(d.value / total) * 100}%`, backgroundColor: d.color }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stackBar: {
    flexDirection: 'row',
    height: 26,
    borderRadius: Radii.sm,
    overflow: 'hidden',
    gap: 2,
  },
  streamRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  divider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  emoji: { width: 30, textAlign: 'center', fontSize: 17 },
  streamTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  streamLabel: { fontFamily: FontFamilies.semiBold, fontSize: 13.5, color: Colors.ink },
  streamValue: { fontFamily: FontFamilies.semiBold, fontSize: 13.5, color: Colors.ink },
  streamTrack: { height: 4, backgroundColor: Colors.surface2, borderRadius: 2, overflow: 'hidden' },
  streamFill: { height: '100%' },
});
