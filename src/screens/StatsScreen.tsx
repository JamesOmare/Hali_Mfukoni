import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { HMIcon } from '../components/HMIcon';
import { Colors, FontFamilies, Radii, Shadows } from '../theme/tokens';
import { useTransactionStore, sumOut, sumIn } from '../store/useTransactionStore';
import { useGoalStore } from '../store/useGoalStore';
import { useTrophyStore } from '../store/useTrophyStore';
import { Segmented } from '../components/Segmented';
import { ScreenHeader } from '../components/ScreenHeader';
import { BarChart } from '../components/charts/BarChart';
import { DonutChart } from '../components/charts/DonutChart';
import { FlowChart } from '../components/charts/FlowChart';
import { CATEGORIES, type CategoryKey } from '../theme/categories';
import { kes } from '../utils/money';
import { todayISO, weekStartISO, monthStartISO } from '../utils/dates';
import type { Transaction } from '../db/transactions';

interface Props { onGoTab: (tab: string) => void; }

const PERIODS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

type ChartStyle = 'bars' | 'donut' | 'flow';

export function StatsScreen({ onGoTab }: Props) {
  const { transactions, todayTx, weekTx, monthTx } = useTransactionStore();
  const goals = useGoalStore();
  const { trophies } = useTrophyStore();
  const [period, setPeriod] = useState<string>('week');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('bars');

  const today = todayISO();
  const txForPeriod = useMemo(() => {
    if (period === 'day') return todayTx();
    if (period === 'week') return weekTx();
    return monthTx();
  }, [period, transactions]);

  const spent = sumOut(txForPeriod);
  const recv = sumIn(txForPeriod);
  const limit = period === 'day' ? goals.limitFor(today) : period === 'week' ? goals.weekly : goals.monthly;
  const hit = spent <= limit;

  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    txForPeriod.filter(t => t.amount < 0).forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + Math.abs(t.amount);
    });
    return Object.entries(map)
      .map(([key, value]) => {
        const cat = CATEGORIES[key as CategoryKey];
        return { key, label: cat?.label ?? key, emoji: cat?.emoji ?? '', value, color: cat?.ink ?? '#999' };
      })
      .sort((a, b) => b.value - a.value);
  }, [txForPeriod]);

  const total = catData.reduce((s, d) => s + d.value, 0) || 1;

  const earnedTrophies = trophies.filter(t => t.earned).slice(0, 4);

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Stats" sub="Where your money goes" />

      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
      </View>

      {/* Totals */}
      <View style={styles.totalsRow}>
        <View style={[styles.totalCard, Shadows.card]}>
          <Text style={[styles.totalCardLabel, { color: '#D2422A' }]}>↓ Spent</Text>
          <Text style={[styles.totalCardAmt, { color: Colors.ink }]}>Ksh {kes(spent)}</Text>
        </View>
        <View style={[styles.totalCard, Shadows.card]}>
          <Text style={[styles.totalCardLabel, { color: Colors.good }]}>↑ Received</Text>
          <Text style={[styles.totalCardAmt, { color: '#0B6E3D' }]}>Ksh {kes(recv)}</Text>
        </View>
      </View>

      {/* Chart card */}
      <View style={[styles.chartCard, Shadows.card]}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionLabel}>BY CATEGORY</Text>
          <View style={styles.chartToggle}>
            {([
              { key: 'bars',  icon: 'barsChart' },
              { key: 'donut', icon: 'donutChart' },
              { key: 'flow',  icon: 'chart' },
            ] as { key: ChartStyle; icon: any }[]).map(s => (
              <TouchableOpacity
                key={s.key}
                style={[styles.chartToggleBtn, chartStyle === s.key && styles.chartToggleBtnActive]}
                onPress={() => setChartStyle(s.key)}
              >
                <HMIcon
                  name={s.icon}
                  size={16}
                  color={chartStyle === s.key ? '#fff' : Colors.ink3}
                  strokeWidth={1.8}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {catData.length === 0
          ? <Text style={styles.empty}>No spending data.</Text>
          : chartStyle === 'bars' ? <BarChart data={catData} />
          : chartStyle === 'donut' ? <DonutChart data={catData} total={total} />
          : <FlowChart data={catData} total={total} />}
      </View>

      {/* Goal hit/miss */}
      <View style={[styles.goalCard, { backgroundColor: hit ? Colors.accent : Colors.bad }, hit ? Shadows.accent : Shadows.bad]}>
        <View style={[styles.goalIcon, { backgroundColor: hit ? 'rgba(21,23,27,0.12)' : 'rgba(255,255,255,0.2)' }]}>
          <Text style={{ fontSize: 22 }}>{hit ? '🎯' : '⚠️'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.goalTitle, { color: hit ? Colors.onAccent : '#fff' }]}>
            {hit ? 'Goal hit! 🎯' : 'Over budget'}
          </Text>
          <Text style={[styles.goalSub, { color: hit ? 'rgba(21,23,27,0.7)' : 'rgba(255,255,255,0.8)' }]}>
            {hit
              ? `Ksh ${kes(limit - spent)} under your ${period} limit`
              : `Ksh ${kes(spent - limit)} over your ${period} limit`}
          </Text>
        </View>
      </View>

      {/* Streak + trophies */}
      <View style={[styles.streakCard, Shadows.card]}>
        <View style={styles.streakRow}>
          <View style={[styles.streakIcon, { backgroundColor: Colors.badFill }]}>
            <Text style={{ fontSize: 24 }}>🔥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakNum}>{/* streak shown via store */}Tracking streak</Text>
            <Text style={styles.streakSub}>Keep going — every day counts</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.trophyRow}>
          <Text style={styles.sectionLabel}>RECENT TROPHIES</Text>
          <TouchableOpacity onPress={() => onGoTab('Trophies')}>
            <Text style={styles.viewAll}>View all →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.trophyGrid}>
          {earnedTrophies.map(tr => (
            <View key={tr.id} style={styles.trophyItem}>
              <View style={[styles.trophyDisc, { backgroundColor: tr.tint + '1a' }]}>
                <Text style={{ fontSize: 26 }}>{tr.emoji}</Text>
              </View>
              <Text style={styles.trophyName} numberOfLines={2}>{tr.name}</Text>
            </View>
          ))}
          {earnedTrophies.length === 0 && (
            <Text style={styles.empty}>No trophies yet — keep tracking!</Text>
          )}
        </View>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  totalsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  totalCard: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, padding: 15 },
  totalCardLabel: { fontFamily: FontFamilies.semiBold, fontSize: 12, marginBottom: 8 },
  totalCardAmt: { fontFamily: FontFamilies.display, fontSize: 23 },
  chartCard: { margin: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.lg, padding: 18 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  chartToggle: { flexDirection: 'row', gap: 4 },
  chartToggleBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.sm },
  chartToggleBtnActive: { backgroundColor: Colors.ink },
  chartToggleText: { fontFamily: FontFamilies.semiBold, fontSize: 11, color: Colors.ink3 },
  chartToggleTextActive: { color: '#fff' },
  goalCard: { marginHorizontal: 16, borderRadius: Radii.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  goalIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  goalTitle: { fontFamily: FontFamilies.display, fontSize: 18 },
  goalSub: { fontFamily: FontFamilies.semiBold, fontSize: 13, marginTop: 2 },
  streakCard: { margin: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.lg, padding: 18 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  streakNum: { fontFamily: FontFamilies.display, fontSize: 19, color: Colors.ink },
  streakSub: { fontFamily: FontFamilies.semiBold, fontSize: 12.5, color: Colors.ink3, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  trophyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  trophyGrid: { flexDirection: 'row', gap: 10 },
  trophyItem: { flex: 1, alignItems: 'center' },
  trophyDisc: { width: '100%', aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  trophyName: { fontFamily: FontFamilies.semiBold, fontSize: 10.5, color: Colors.ink2, textAlign: 'center', lineHeight: 14 },
  sectionLabel: { fontFamily: FontFamilies.semiBold, fontSize: 11, color: Colors.ink3, letterSpacing: 0.8, textTransform: 'uppercase' },
  viewAll: { fontFamily: FontFamilies.semiBold, fontSize: 13, color: Colors.ink2 },
  empty: { fontFamily: FontFamilies.medium, fontSize: 13, color: Colors.ink3 },
});
