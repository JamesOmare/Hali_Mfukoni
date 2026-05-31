import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamilies } from '../theme/tokens';

interface Props {
  title: string;
  sub?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  big?: boolean;
}

export function ScreenHeader({ title, sub, left, right, big = false }: Props) {
  return (
    <View style={styles.row}>
      {left}
      <View style={styles.titleBox}>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
        <Text style={[styles.title, big && styles.titleBig]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  titleBox: { flex: 1, minWidth: 0 },
  sub: {
    fontFamily: FontFamilies.medium,
    fontSize: 13,
    color: Colors.ink3,
    marginBottom: 2,
  },
  title: {
    fontFamily: FontFamilies.display,
    fontSize: 23,
    color: Colors.ink,
    letterSpacing: -0.8,
  },
  titleBig: { fontSize: 30 },
});
