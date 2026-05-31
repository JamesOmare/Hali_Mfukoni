import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, FlatList,
  TouchableOpacity, StyleSheet, SectionList, Animated,
} from 'react-native';
import { Colors, FontFamilies, Radii } from '../theme/tokens';
import { HMIcon } from '../components/HMIcon';
import { useTransactionStore, sumOut, sumIn } from '../store/useTransactionStore';
import { useFulizaStore } from '../store/useFulizaStore';
import { TxRow } from '../components/TxRow';
import { Segmented } from '../components/Segmented';
import { ScreenHeader } from '../components/ScreenHeader';
import { CATEGORIES, CATEGORY_ORDER, type CategoryKey } from '../theme/categories';
import { kes } from '../utils/money';
import { todayISO, weekStartISO, monthStartISO, last30DaysStartISO } from '../utils/dates';
import { scanInbox } from '../sms/scanner';
import type { Transaction } from '../db/transactions';

interface Props { onOpenTx: (id: string) => void; }

const PERIODS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: '30d', label: '30 Days' },
  { value: 'month', label: 'Month' },
];

export function ListScreen({ onOpenTx }: Props) {
  const { transactions, load } = useTransactionStore();
  const loadFuliza = useFulizaStore(s => s.load);
  const [period, setPeriod] = useState('day');
  const [cat, setCat] = useState<string>('all');
  const [scanning, setScanning] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  const showBanner = (msg: string) => {
    setSyncMsg(msg);
    bannerOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(2500),
      Animated.timing(bannerOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const handleRefresh = async () => {
    setScanning(true);
    const result = await scanInbox();
    await Promise.all([load(), loadFuliza()]);
    setScanning(false);
    const label = result.inserted > 0
      ? `✓ ${result.inserted} new added  ·  ${result.mpesaSms} M-Pesa SMS found`
      : `✓ Up to date  ·  ${result.mpesaSms} M-Pesa SMS found`;
    showBanner(label);
  };

  // Filter transactions by period and category
  const filtered = useMemo(() => {
    const today = todayISO();
    let list = transactions.filter(t => t.dateIso); // exclude empty dates
    if (period === 'day') {
      list = list.filter(t => t.dateIso === today);
    } else if (period === 'week') {
      const start = weekStartISO();
      list = list.filter(t => t.dateIso >= start && t.dateIso <= today);
    } else if (period === '30d') {
      const start = last30DaysStartISO();
      list = list.filter(t => t.dateIso >= start && t.dateIso <= today);
    } else if (period === 'month') {
      const start = monthStartISO();
      list = list.filter(t => t.dateIso >= start && t.dateIso <= today);
    }
    if (cat !== 'all') list = list.filter(t => t.category === cat);
    return list;
  }, [transactions, period, cat]);

  const totalOut = sumOut(filtered);
  const totalIn  = sumIn(filtered);

  // Build sections for SectionList: [{title, data}]
  const sections = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    for (const tx of filtered) {
      if (!map[tx.dateIso]) map[tx.dateIso] = [];
      map[tx.dateIso].push(tx);
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateIso, data]) => ({ title: dateIso, data }));
  }, [filtered]);

  const today = todayISO();

  const renderItem = useCallback(({ item }: { item: Transaction }) => (
    <View style={styles.txDivider}>
      <TxRow tx={item} onPress={() => onOpenTx(item.id)} badgeShape="chip" />
    </View>
  ), [onOpenTx]);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View style={styles.dateHeader}>
      <Text style={styles.dateLabel}>
        {section.title === today
          ? `Today · ${new Date(section.title + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
          : new Date(section.title + 'T00:00:00').toLocaleDateString('en-KE', {
              weekday: 'long', day: 'numeric', month: 'short',
            })}
      </Text>
    </View>
  ), [today]);

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Transactions"
        sub="All your M-Pesa activity"
        right={
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={scanning}>
            <HMIcon name="refresh" size={18} color={scanning ? Colors.ink3 : Colors.ink} />
          </TouchableOpacity>
        }
      />

      {/* Sync result banner */}
      <Animated.View style={[styles.syncBanner, { opacity: bannerOpacity }]} pointerEvents="none">
        <Text style={styles.syncBannerText}>{syncMsg}</Text>
      </Animated.View>

      <View style={styles.segmentedWrap}>
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
      </View>

      {/* Category filter rail */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRail}
      >
        <FilterChip active={cat === 'all'} onPress={() => setCat('all')} label="All" />
        {CATEGORY_ORDER.map(k => (
          <FilterChip
            key={k}
            active={cat === k}
            onPress={() => setCat(k)}
            label={`${CATEGORIES[k].emoji} ${CATEGORIES[k].label}`}
            activeInk={CATEGORIES[k].ink}
            activeBg={CATEGORIES[k].bg}
          />
        ))}
      </ScrollView>

      {/* Out / In totals */}
      <View style={styles.totalsRow}>
        <View style={styles.totalItem}>
          <View style={[styles.totalIcon, { backgroundColor: Colors.badFill }]}>
            <HMIcon name="trendDown" size={14} color="#D2422A" />
          </View>
          <View>
            <Text style={styles.totalLabel}>Out</Text>
            <Text style={[styles.totalAmount, { color: '#D2422A' }]}>Ksh {kes(totalOut)}</Text>
          </View>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <View style={[styles.totalIcon, { backgroundColor: Colors.goodFill }]}>
            <HMIcon name="trendUp" size={14} color={Colors.good} />
          </View>
          <View>
            <Text style={styles.totalLabel}>In</Text>
            <Text style={[styles.totalAmount, { color: Colors.good }]}>Ksh {kes(totalIn)}</Text>
          </View>
        </View>
      </View>

      {/* Virtualized transaction list — SectionList only renders visible rows */}
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        stickySectionHeadersEnabled={true}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {scanning ? 'Scanning M-Pesa messages…' : 'No transactions here.'}
          </Text>
        }
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
}

function FilterChip({ active, onPress, label, activeInk, activeBg }: {
  active: boolean;
  onPress: () => void;
  label: string;
  activeInk?: string;
  activeBg?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && { borderColor: activeInk ?? Colors.ink, backgroundColor: activeBg ?? Colors.ink },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, active && { color: activeInk ? activeInk : '#fff' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: Colors.canvas },
  segmentedWrap: { paddingHorizontal: 20, paddingTop: 10 },
  filterScroll:  { flexGrow: 0, flexShrink: 0 },
  filterRail:    { paddingHorizontal: 20, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  chip: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    borderColor: Colors.border2,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 12.5,
    color: Colors.ink2,
    lineHeight: 16,
  },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  syncBanner: {
    marginHorizontal: 16,
    marginTop: 6,
    backgroundColor: Colors.goodFill,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  syncBannerText: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 12,
    color: Colors.good,
  },
  totalsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 6,
  },
  totalItem:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  totalIcon:    { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  totalLabel:   { fontFamily: FontFamilies.semiBold, fontSize: 11, color: Colors.ink3 },
  totalAmount:  { fontFamily: FontFamilies.display, fontSize: 15 },
  totalDivider: { width: 1, height: 32, backgroundColor: Colors.border, marginHorizontal: 12 },
  dateHeader: {
    paddingVertical: 8,
    backgroundColor: Colors.canvas,
  },
  dateLabel: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 11,
    color: Colors.ink3,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  txDivider:    { borderBottomWidth: 1, borderBottomColor: Colors.border },
  empty: {
    fontFamily: FontFamilies.medium,
    fontSize: 14, color: Colors.ink3,
    textAlign: 'center', paddingVertical: 60,
  },
});
