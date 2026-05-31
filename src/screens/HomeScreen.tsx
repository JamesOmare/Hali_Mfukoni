import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, StatusBar,
} from 'react-native';
import { HMIcon } from '../components/HMIcon';
import { AppLogo } from '../components/AppLogo';
import { Colors, FontFamilies, Shadows } from '../theme/tokens';
import { useTransactionStore, sumOut, sumIn } from '../store/useTransactionStore';
import { useGoalStore } from '../store/useGoalStore';
import { useFulizaStore } from '../store/useFulizaStore';
import { TxRow } from '../components/TxRow';
import { ProgressBar } from '../components/ProgressBar';
import { kes } from '../utils/money';
import { todayISO } from '../utils/dates';

interface Props {
  onOpenTx: (id: string) => void;
  onGoTab: (tab: string) => void;
}

const CARD: any = {
  backgroundColor: '#fff',
  borderRadius: 20,
  ...Shadows.card,
};

export function HomeScreen({ onOpenTx, onGoTab }: Props) {
  const { transactions, todayTx, weekTx, monthTx, streak, latestBalance } = useTransactionStore();
  const goals        = useGoalStore();
  const { outstanding: fulizaOutstanding, dueDate: fulizaDueDate } = useFulizaStore();

  const today             = todayISO();
  const todayTransactions = useMemo(() => todayTx(),  [transactions]);
  const weekTransactions  = useMemo(() => weekTx(),   [transactions]);
  const monthTransactions = useMemo(() => monthTx(),  [transactions]);

  const spentToday  = sumOut(todayTransactions);
  const spentWeek   = sumOut(weekTransactions);
  const spentMonth  = sumOut(monthTransactions);
  const recvToday   = sumIn(todayTransactions);

  const dailyGoal  = goals.limitFor(today);
  const over       = dailyGoal > 0 && spentToday > dailyGoal;
  const pct        = dailyGoal > 0 ? Math.min(Math.round((spentToday / dailyGoal) * 100), 100) : 0;
  const remaining  = dailyGoal - spentToday;
  const streak_    = streak();
  const balance    = latestBalance();

  const showFulizaChip = balance === 0 && fulizaOutstanding > 0;

  const recent = transactions.slice(0, 5);

  const dateStr = new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.canvas} />

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <AppLogo size={38} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerSub}>Hali Mfukoni</Text>
          <Text style={styles.headerDate}>{dateStr}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          android_ripple={{ color: Colors.border, borderless: false, radius: 20 }}
        >
          <HMIcon name="bell" size={18} color={Colors.ink} />
        </Pressable>
      </View>

      {/* ── M-Pesa Balance Card ──────────────────────────────── */}
      <View style={[styles.balanceCard, CARD]}>
        <View style={styles.balanceTop}>
          <Text style={styles.balanceLabel}>M-PESA BALANCE</Text>
          <View style={[styles.balanceDot, { backgroundColor: showFulizaChip ? '#FCA5A5' : '#6EE7B7' }]} />
        </View>

        <View style={styles.balanceRow}>
          <Text style={[styles.balanceAmount, showFulizaChip && styles.balanceZero]}>
            {balance === null ? '—' : `Ksh ${kes(balance)}`}
          </Text>

          {showFulizaChip && (
            <View style={styles.fulizaInline}>
              <Text style={styles.fulizaInlineLabel}>FULIZA DUE</Text>
              <View style={styles.fulizaInlineChip}>
                <Text style={styles.fulizaInlineAmt}>Ksh {kes(fulizaOutstanding)}</Text>
              </View>
              {fulizaDueDate ? (
                <View style={styles.fulizaDueBadge}>
                  <Text style={styles.fulizaDueText}>
                    Due {new Date(fulizaDueDate + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {recvToday > 0 && (
          <View style={styles.recvRow}>
            <Text style={styles.recvRowLabel}>Received today</Text>
            <Text style={styles.recvRowAmt}>+Ksh {kes(recvToday)}</Text>
          </View>
        )}
      </View>

      {/* ── Spending Today Card ──────────────────────────────── */}
      <View style={[styles.spendCard, Shadows.accent, over && Shadows.bad, over && styles.spendCardOver]}>
        <View style={styles.spendTopRow}>
          <View>
            <Text style={[styles.spendLabel, over && styles.lightText]}>Spent Today</Text>
            <Text style={[styles.spendAmount, over && styles.lightText]}>
              Ksh {kes(spentToday)}
            </Text>
          </View>
          {streak_ > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={[styles.streakNum, over && styles.lightText]}>{streak_}d</Text>
            </View>
          )}
        </View>

        {dailyGoal > 0 && (
          <>
            <View style={{ marginTop: 16 }}>
              <ProgressBar
                pct={pct}
                height={8}
                color={over ? 'rgba(255,255,255,0.9)' : Colors.ink}
                trackColor={over ? 'rgba(255,255,255,0.25)' : 'rgba(21,23,27,0.1)'}
              />
            </View>
            <View style={styles.spendBottomRow}>
              <Text style={[styles.spendMeta, over && styles.lightDim]}>
                {over
                  ? `Ksh ${kes(spentToday - dailyGoal)} over budget`
                  : `Ksh ${kes(remaining)} remaining`}
              </Text>
              <Text style={[styles.spendMeta, over && styles.lightDim]}>
                Goal Ksh {kes(dailyGoal)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* ── Week / Month ─────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <PeriodCard label="This Week" spent={spentWeek} limit={goals.weekly} />
        <PeriodCard label="This Month" spent={spentMonth} limit={goals.monthly} />
      </View>

      {/* ── Recent Activity ──────────────────────────────────── */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
        <Pressable
          onPress={() => onGoTab('Activity')}
          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, flexDirection: 'row', alignItems: 'center', gap: 2 }]}
        >
          <Text style={styles.seeAll}>See all</Text>
          <HMIcon name="chevRight" size={13} color={Colors.ink2} />
        </Pressable>
      </View>

      <View style={[styles.recentCard, CARD]}>
        {recent.length === 0 ? (
          <Text style={styles.empty}>No transactions yet.{'\n'}Scan your M-Pesa SMS to get started.</Text>
        ) : (
          recent.map((tx, i) => (
            <View key={tx.id} style={i < recent.length - 1 ? styles.txDivider : undefined}>
              <TxRow tx={tx} onPress={() => onOpenTx(tx.id)} badgeShape="chip" />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function PeriodCard({ label, spent, limit }: { label: string; spent: number; limit: number }) {
  const pct  = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
  const over = limit > 0 && spent > limit;
  return (
    <View style={[styles.periodCard, CARD]}>
      <Text style={styles.periodLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.periodAmt, over && { color: Colors.bad }]}>Ksh {kes(spent)}</Text>
      <View style={{ marginTop: 8 }}>
        <ProgressBar pct={pct} height={5} color={over ? Colors.bad : Colors.accentDeep} trackColor="rgba(21,23,27,0.07)" />
      </View>
      <Text style={[styles.periodMeta, over && { color: Colors.bad }]}>
        {pct}% {limit > 0 ? `of Ksh ${kes(limit)}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F3F0' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  headerSub:  { fontFamily: FontFamilies.display, fontSize: 17, color: Colors.ink, letterSpacing: -0.3 },
  headerDate: { fontFamily: FontFamilies.medium, fontSize: 12.5, color: Colors.ink3, marginTop: 1 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },

  // Balance card
  balanceCard:   { marginHorizontal: 16, marginBottom: 12, padding: 20 },
  balanceTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  balanceLabel:  { fontFamily: FontFamilies.semiBold, fontSize: 11, color: Colors.ink3, letterSpacing: 0.8, flex: 1 },
  balanceDot:    { width: 8, height: 8, borderRadius: 4 },
  balanceRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  balanceAmount: { fontFamily: FontFamilies.display, fontSize: 42, color: Colors.ink, letterSpacing: -1.5 },
  balanceZero:   { color: Colors.ink3 },

  // Fuliza inline chip
  fulizaInline:     { paddingBottom: 5, gap: 4 },
  fulizaInlineLabel: { fontFamily: FontFamilies.semiBold, fontSize: 9, color: '#DC2626', letterSpacing: 0.6 },
  fulizaInlineChip:  { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  fulizaInlineAmt:   { fontFamily: FontFamilies.display, fontSize: 17, color: '#DC2626', letterSpacing: -0.5 },
  fulizaDueBadge:    { backgroundColor: '#FECACA', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  fulizaDueText:     { fontFamily: FontFamilies.semiBold, fontSize: 10, color: '#7F1D1D' },

  // Received today
  recvRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  recvRowLabel: { fontFamily: FontFamilies.medium, fontSize: 13, color: Colors.ink3 },
  recvRowAmt:  { fontFamily: FontFamilies.semiBold, fontSize: 15, color: Colors.good },

  // Spending card
  spendCard: { marginHorizontal: 16, marginBottom: 12, padding: 20, backgroundColor: Colors.accent, borderRadius: 20 },
  spendCardOver: { backgroundColor: Colors.bad },
  spendTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  spendLabel:  { fontFamily: FontFamilies.semiBold, fontSize: 13, color: 'rgba(21,23,27,0.65)' },
  spendAmount: { fontFamily: FontFamilies.display, fontSize: 46, color: Colors.ink, letterSpacing: -1.5, marginTop: 2 },
  lightText:   { color: '#fff' },
  lightDim:    { color: 'rgba(255,255,255,0.75)' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(21,23,27,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  streakEmoji: { fontSize: 14 },
  streakNum:   { fontFamily: FontFamilies.semiBold, fontSize: 13, color: Colors.ink },
  spendBottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  spendMeta:   { fontFamily: FontFamilies.semiBold, fontSize: 12.5, color: 'rgba(21,23,27,0.6)' },

  // Period cards
  statsRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  periodCard:  { flex: 1, padding: 14 },
  periodLabel: { fontFamily: FontFamilies.semiBold, fontSize: 10, color: Colors.ink3, letterSpacing: 0.8 },
  periodAmt:   { fontFamily: FontFamilies.display, fontSize: 20, color: Colors.ink, marginTop: 4, letterSpacing: -0.5 },
  periodMeta:  { fontFamily: FontFamilies.medium, fontSize: 11, color: Colors.ink3, marginTop: 4 },

  // Recent
  sectionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  sectionLabel: { fontFamily: FontFamilies.semiBold, fontSize: 11, color: Colors.ink3, letterSpacing: 0.8 },
  seeAll:      { fontFamily: FontFamilies.semiBold, fontSize: 13, color: Colors.ink2 },
  recentCard:  { marginHorizontal: 16, paddingHorizontal: 4, paddingVertical: 4 },
  txDivider:   { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  empty:       { fontFamily: FontFamilies.medium, fontSize: 14, color: Colors.ink3, textAlign: 'center', paddingVertical: 28, lineHeight: 22 },
});
