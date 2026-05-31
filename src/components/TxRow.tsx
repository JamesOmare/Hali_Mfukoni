import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontFamilies, Radii } from '../theme/tokens';
import { formatTime } from '../utils/dates';
import { CATEGORIES, type CategoryKey } from '../theme/categories';
import { CategoryBadge } from './CategoryBadge';
import { kes } from '../utils/money';
import type { Transaction } from '../db/transactions';

interface Props {
  tx: Transaction;
  onPress: () => void;
  badgeShape?: 'chip' | 'pill' | 'tag';
  showDate?: boolean;
}

export function TxRow({ tx, onPress, badgeShape = 'chip', showDate = false }: Props) {
  const cat = CATEGORIES[tx.category as CategoryKey] ?? CATEGORIES.shopping;
  const out = tx.amount < 0;
  const isFuliza = tx.subType?.includes('Fuliza') && tx.cost > 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar disc */}
      <View style={[styles.avatar, { backgroundColor: cat.bg }]}>
        <Text style={styles.emoji}>{cat.emoji}</Text>
      </View>

      <View style={styles.content}>
        {/* Name + amount */}
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{tx.name}</Text>
          <Text style={[styles.amount, { color: out ? '#D2422A' : Colors.good }]}>
            {out ? '−' : '+'}Ksh {kes(tx.amount)}
          </Text>
        </View>
        {/* Fuliza access fee sub-line */}
        {isFuliza && (
          <View style={styles.fulizaRow}>
            <Text style={styles.fulizaLabel}>🔄 Fuliza access fee</Text>
            <Text style={styles.fulizaFee}>−Ksh {kes(tx.cost)}</Text>
          </View>
        )}
        {/* Badge + time */}
        <View style={styles.bottomRow}>
          <CategoryBadge category={tx.category as CategoryKey} shape={badgeShape} size="sm" />
          <Text style={styles.time}>
            {showDate ? `${tx.dateIso.slice(5)} · ` : ''}{formatTime(tx.time)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: { fontSize: 20 },
  content: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 5,
  },
  name: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 15.5,
    color: Colors.ink,
    letterSpacing: -0.3,
    flex: 1,
  },
  amount: {
    fontFamily: FontFamilies.display,
    fontSize: 15.5,
    letterSpacing: -0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontFamily: FontFamilies.regular,
    fontSize: 12,
    color: Colors.ink3,
  },
  fulizaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fulizaLabel: {
    fontFamily: FontFamilies.medium,
    fontSize: 11.5,
    color: '#B45309',
  },
  fulizaFee: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 11.5,
    color: '#B45309',
  },
});
