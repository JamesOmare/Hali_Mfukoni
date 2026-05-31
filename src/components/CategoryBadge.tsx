import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CATEGORIES, type CategoryKey } from '../theme/categories';
import { FontFamilies, Radii } from '../theme/tokens';

type Shape = 'chip' | 'pill' | 'tag';
type Size = 'sm' | 'lg';

interface Props {
  category: CategoryKey;
  shape?: Shape;
  size?: Size;
}

export function CategoryBadge({ category, shape = 'chip', size = 'sm' }: Props) {
  const cat = CATEGORIES[category];
  const small = size === 'sm';
  const fs = small ? 11.5 : 13;
  const padV = small ? 4 : 6;
  const padH = small ? 9 : 12;

  if (shape === 'chip') {
    return (
      <View style={[styles.chip, { borderColor: cat.ink, paddingVertical: padV, paddingHorizontal: padH, borderRadius: Radii.sm }]}>
        <View style={[styles.chipDot, { backgroundColor: cat.ink }]} />
        <Text style={[styles.chipLabel, { color: cat.ink, fontSize: fs }]}>{cat.label}</Text>
      </View>
    );
  }

  if (shape === 'tag') {
    return (
      <View style={[styles.tag, { borderColor: cat.bg }]}>
        <View style={[styles.tagEmoji, { backgroundColor: cat.ink, paddingVertical: padV, paddingHorizontal: padH - 3 }]}>
          <Text style={{ fontSize: fs + 1 }}>{cat.emoji}</Text>
        </View>
        <View style={[styles.tagLabel, { backgroundColor: cat.bg, paddingVertical: padV, paddingHorizontal: padH }]}>
          <Text style={[styles.tagText, { color: cat.ink, fontSize: fs }]}>{cat.label}</Text>
        </View>
      </View>
    );
  }

  // pill (default)
  return (
    <View style={[styles.pill, { backgroundColor: cat.bg, paddingVertical: padV, paddingHorizontal: padH, borderRadius: Radii.pill }]}>
      <Text style={{ fontSize: fs + 1, marginRight: 4 }}>{cat.emoji}</Text>
      <Text style={[styles.pillLabel, { color: cat.ink, fontSize: fs }]}>{cat.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  chipLabel: {
    fontFamily: FontFamilies.semiBold,
    lineHeight: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  pillLabel: {
    fontFamily: FontFamilies.semiBold,
    lineHeight: 16,
  },
  tag: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  tagEmoji: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    fontFamily: FontFamilies.semiBold,
    lineHeight: 16,
  },
});
