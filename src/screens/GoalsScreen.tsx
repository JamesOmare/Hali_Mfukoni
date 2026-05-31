import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet,
} from 'react-native';
import { Colors, FontFamilies, Radii, Shadows } from '../theme/tokens';
import { useGoalStore } from '../store/useGoalStore';
import { ScreenHeader } from '../components/ScreenHeader';
import { kes } from '../utils/money';

const QUICK_DAILY = [1000, 1500, 2000, 2500, 3000];
const QUICK_OVERRIDE = [500, 1000, 1500, 2000, 2500, 3500];

export function GoalsScreen() {
  const goals = useGoalStore();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const todayNum = now.getDate();
  const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  function isoForDay(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Goals" sub="Set your spending limits" />

      {/* Daily limit */}
      <View style={[styles.card, Shadows.card]}>
        <Text style={styles.cardTitle}>🎯 DEFAULT DAILY LIMIT</Text>
        <Stepper value={goals.daily} onChange={goals.setDaily} step={100} min={100} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }} contentContainerStyle={{ gap: 8 }}>
          {QUICK_DAILY.map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.quickChip, goals.daily === v && styles.quickChipActive]}
              onPress={() => goals.setDaily(v)}
            >
              <Text style={[styles.quickChipText, goals.daily === v && styles.quickChipTextActive]}>
                {kes(v)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Per-day calendar overrides */}
      <View style={[styles.card, Shadows.card]}>
        <Text style={styles.cardTitle}>📅 PER-DAY OVERRIDES</Text>
        <Text style={styles.calendarSub}>
          {now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })} · tap a day to set a custom limit
        </Text>
        {/* DOW headers */}
        <View style={styles.calGrid}>
          {DOW.map((d, i) => (
            <Text key={i} style={styles.dowLabel}>{d}</Text>
          ))}
        </View>
        {/* Day cells */}
        <View style={styles.calGrid}>
          {Array.from({ length: firstDow }).map((_, i) => <View key={`e${i}`} style={styles.calCell} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const iso = isoForDay(d);
            const ov = goals.overrides[iso];
            const isSel = selectedDay === iso;
            const isToday = d === todayNum;
            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.calCell,
                  styles.calDay,
                  ov != null && styles.calDayOverride,
                  isSel && styles.calDaySelected,
                  isToday && !isSel && styles.calDayToday,
                ]}
                onPress={() => setSelectedDay(isSel ? null : iso)}
              >
                <Text style={[styles.calDayNum, ov != null && styles.calDayNumBold]}>{d}</Text>
                {ov != null && (
                  <Text style={styles.calOvLabel}>
                    {(ov / 1000).toFixed(ov % 1000 ? 1 : 0)}k
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDay && (() => {
          const cur = goals.overrides[selectedDay] ?? goals.daily;
          const dt = new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-KE', {
            weekday: 'long', day: 'numeric', month: 'long',
          });
          return (
            <View style={styles.overridePanel}>
              <View style={styles.overridePanelHeader}>
                <Text style={styles.overridePanelDate}>{dt}</Text>
                {goals.overrides[selectedDay] != null && (
                  <TouchableOpacity onPress={() => { goals.removeDayOverride(selectedDay); setSelectedDay(null); }}>
                    <Text style={styles.resetLink}>Reset to default</Text>
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {QUICK_OVERRIDE.map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.quickChip, cur === v && styles.quickChipActive]}
                    onPress={() => goals.setDayOverride(selectedDay, v)}
                  >
                    <Text style={[styles.quickChipText, cur === v && styles.quickChipTextActive]}>
                      {kes(v)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })()}
      </View>

      {/* Weekly / Monthly */}
      <View style={[styles.card, Shadows.card, { padding: 0 }]}>
        {[
          { label: 'Weekly limit', on: goals.weeklyOn, toggle: goals.setWeeklyOn, val: goals.weekly, set: goals.setWeekly, step: 500 },
          { label: 'Monthly limit', on: goals.monthlyOn, toggle: goals.setMonthlyOn, val: goals.monthly, set: goals.setMonthly, step: 1000 },
        ].map((row, i) => (
          <View key={row.label} style={[styles.toggleRow, i > 0 && styles.toggleRowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>{row.label}</Text>
              <Text style={styles.toggleSub}>{row.on ? `Ksh ${kes(row.val)}` : 'Off — no cap'}</Text>
            </View>
            <Switch
              value={row.on}
              onValueChange={row.toggle}
              trackColor={{ true: Colors.ink, false: Colors.border2 }}
              thumbColor={row.on ? Colors.accent : '#fff'}
            />
            {row.on && (
              <View style={{ width: '100%', marginTop: 12 }}>
                <Stepper value={row.val} onChange={row.set} step={row.step} min={row.step} />
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function Stepper({ value, onChange, step, min }: { value: number; onChange: (v: number) => void; step: number; min: number }) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.max(min, value - step))}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>Ksh {kes(value)}</Text>
      <TouchableOpacity style={[styles.stepBtn, styles.stepBtnActive]} onPress={() => onChange(value + step)}>
        <Text style={[styles.stepBtnText, { color: Colors.accent }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  card: { margin: 16, marginTop: 0, marginBottom: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.lg, padding: 20 },
  cardTitle: { fontFamily: FontFamilies.semiBold, fontSize: 11, color: Colors.ink, letterSpacing: 0.8, marginBottom: 16 },
  calendarSub: { fontFamily: FontFamilies.medium, fontSize: 12.5, color: Colors.ink3, marginBottom: 14 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dowLabel: { width: '13%', textAlign: 'center', fontFamily: FontFamilies.semiBold, fontSize: 11, color: Colors.ink3, paddingVertical: 2 },
  calCell: { width: '13%', aspectRatio: 1 },
  calDay: { borderRadius: 11, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  calDayOverride: { backgroundColor: Colors.accent },
  calDaySelected: { borderWidth: 2, borderColor: Colors.ink },
  calDayToday: { borderWidth: 1.5, borderColor: Colors.accentDeep },
  calDayNum: { fontFamily: FontFamilies.medium, fontSize: 13, color: Colors.ink },
  calDayNumBold: { fontFamily: FontFamilies.display },
  calOvLabel: { fontFamily: FontFamilies.display, fontSize: 8.5, color: Colors.ink, opacity: 0.7 },
  overridePanel: { marginTop: 14, padding: 14, backgroundColor: Colors.surface2, borderRadius: Radii.md },
  overridePanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  overridePanelDate: { fontFamily: FontFamilies.semiBold, fontSize: 13.5, color: Colors.ink },
  resetLink: { fontFamily: FontFamilies.semiBold, fontSize: 12.5, color: Colors.bad },
  quickChip: { borderWidth: 1.5, borderColor: Colors.border2, backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radii.pill },
  quickChipActive: { borderColor: Colors.ink, backgroundColor: Colors.ink },
  quickChipText: { fontFamily: FontFamilies.semiBold, fontSize: 13, color: Colors.ink2 },
  quickChipTextActive: { color: '#fff' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: { width: 42, height: 42, borderRadius: Radii.pill, borderWidth: 1.5, borderColor: Colors.border2, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepBtnActive: { borderWidth: 0, backgroundColor: Colors.ink },
  stepBtnText: { fontFamily: FontFamilies.display, fontSize: 22, color: Colors.ink },
  stepValue: { flex: 1, textAlign: 'center', fontFamily: FontFamilies.display, fontSize: 30, color: Colors.ink },
  toggleRow: { padding: 16, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  toggleRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  toggleLabel: { fontFamily: FontFamilies.semiBold, fontSize: 15, color: Colors.ink },
  toggleSub: { fontFamily: FontFamilies.medium, fontSize: 12.5, color: Colors.ink3, marginTop: 2 },
});
