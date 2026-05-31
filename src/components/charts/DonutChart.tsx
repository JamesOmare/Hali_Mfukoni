import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Colors, FontFamilies } from '../../theme/tokens';
import type { ChartEntry } from './BarChart';

export function DonutChart({ data, total }: { data: ChartEntry[]; total: number }) {
  const r = 62, sw = 26, circ = 2 * Math.PI * r;
  let acc = 0;

  return (
    <View style={styles.row}>
      <Svg width={160} height={160} viewBox="0 0 160 160">
        <Circle cx={80} cy={80} r={r} fill="none" stroke={Colors.surface2} strokeWidth={sw} />
        {data.map(d => {
          const frac = d.value / total;
          const seg = frac * circ;
          const off = circ * 0.25 - acc * circ; // start at top
          acc += frac;
          return (
            <Circle
              key={d.key}
              cx={80} cy={80} r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={sw}
              strokeDasharray={`${seg} ${circ - seg}`}
              strokeDashoffset={off}
            />
          );
        })}
        <SvgText x={80} y={74} textAnchor="middle" fill={Colors.ink3} fontSize={13} fontFamily={FontFamilies.semiBold}>Spent</SvgText>
        <SvgText x={80} y={94} textAnchor="middle" fill={Colors.ink} fontSize={16} fontFamily={FontFamilies.display}>
          {(total / 1000).toFixed(1)}k
        </SvgText>
      </Svg>
      <View style={styles.legend}>
        {data.map(d => (
          <View key={d.key} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: d.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{d.label}</Text>
            <Text style={styles.legendPct}>{Math.round((d.value / total) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 6 },
  legend: { flex: 1, gap: 9 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 3, flexShrink: 0 },
  legendLabel: { fontFamily: FontFamilies.semiBold, fontSize: 12.5, color: Colors.ink, flex: 1 },
  legendPct: { fontFamily: FontFamilies.semiBold, fontSize: 12, color: Colors.ink2 },
});
