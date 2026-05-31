import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert,
} from 'react-native';
import { Colors, FontFamilies, Radii, Shadows } from '../theme/tokens';
import { formatTime } from '../utils/dates';
import { useTransactionStore } from '../store/useTransactionStore';
import { useMerchantRulesStore } from '../store/useMerchantRulesStore';
import { upsertMerchantRule, applyRuleToExisting, countByPattern, broadenPattern } from '../db/merchantRules';
import { CATEGORIES, CATEGORY_ORDER, type CategoryKey } from '../theme/categories';
import { CategoryBadge } from '../components/CategoryBadge';
import { kes } from '../utils/money';
import type { Transaction } from '../db/transactions';

interface Props {
  tx: Transaction;
  onBack: () => void;
}

export function DetailScreen({ tx, onBack }: Props) {
  const { changeCategory, saveNote, load: reloadTx } = useTransactionStore();
  const loadRules = useMerchantRulesStore(s => s.load);
  const [catKey, setCatKey] = useState<CategoryKey>(tx.category as CategoryKey);
  const [picking, setPicking] = useState(false);
  const [note, setNote] = useState(tx.note ?? '');
  const [noteFocused, setNoteFocused] = useState(false);

  const cat = CATEGORIES[catKey];
  const out = tx.amount < 0;

  const handleCatChange = async (key: CategoryKey) => {
    setCatKey(key);
    setPicking(false);
    await changeCategory(tx.id, key);

    // Use the broadened pattern ("DIRECT PAY" covers both "DIRECT PAY 04" and "05")
    const pattern = broadenPattern(tx.name);
    const others  = await countByPattern(pattern, tx.id);
    if (others > 0) {
      const catLabel    = CATEGORIES[key]?.label ?? key;
      const patternNote = pattern !== tx.name ? `"${pattern}" (all variants)` : `"${tx.name}"`;
      Alert.alert(
        'Apply to all?',
        `${others} other transaction${others > 1 ? 's' : ''} from ${patternNote} found.\n\nMark all as ${catLabel} and save for future ones?`,
        [
          { text: 'Just this one', style: 'cancel' },
          {
            text: `Apply to all ${others + 1}`,
            onPress: async () => {
              try {
                await upsertMerchantRule(pattern, key);
                await applyRuleToExisting(pattern, key);
                await Promise.all([reloadTx(), loadRules()]);
              } catch (e) {
                console.error('Apply rule failed:', e);
              }
            },
          },
        ],
      );
    }
  };

  const handleNoteBlur = () => {
    setNoteFocused(false);
    saveNote(tx.id, note);
  };

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={{ fontSize: 20, color: Colors.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Transaction</Text>
        <TouchableOpacity style={styles.backBtn}>
          <Text style={{ fontSize: 20, color: Colors.ink }}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroDisc, { backgroundColor: cat.bg }]}>
            <Text style={{ fontSize: 40 }}>{cat.emoji}</Text>
          </View>
          <Text style={styles.heroName}>{tx.name}</Text>
          <Text style={styles.heroMeta}>{tx.subType} · {tx.dateIso} {formatTime(tx.time)}</Text>
          <Text style={[styles.heroAmount, { color: out ? '#D2422A' : Colors.good }]}>
            {out ? '−' : '+'}Ksh {kes(tx.amount)}
          </Text>
        </View>

        {/* Editable category */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardRow}>
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <TouchableOpacity onPress={() => setPicking(!picking)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>✏️ {picking ? 'Done' : 'Change'}</Text>
            </TouchableOpacity>
          </View>
          {!picking
            ? <View style={{ marginTop: 14 }}><CategoryBadge category={catKey} shape="chip" size="lg" /></View>
            : (
              <View style={styles.catPicker}>
                {CATEGORY_ORDER.map(key => {
                  const c = CATEGORIES[key];
                  const active = key === catKey;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.catChip, active && { borderColor: c.ink, backgroundColor: c.bg }]}
                      onPress={() => handleCatChange(key)}
                    >
                      <Text style={[styles.catChipText, active && { color: c.ink }]}>
                        {c.emoji} {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
        </View>

        {/* Parsed details */}
        <View style={[styles.card, Shadows.card, { paddingHorizontal: 16 }]}>
          <View style={{ paddingVertical: 14 }}>
            <Text style={styles.sectionLabel}>PARSED DETAILS</Text>
          </View>
          {tx.category === 'fuliza'
            ? [
                { label: 'M-Pesa code', value: tx.id.replace('_fuliza', ''), mono: true },
                { label: 'Access fee', value: `Ksh ${kes(tx.cost)}` },
                { label: 'Outstanding balance', value: `Ksh ${kes(tx.balance)}` },
                { label: 'Due date', value: tx.who || '—' },
              ].map((f, i, arr) => (
                <View key={f.label} style={[styles.fieldRow, i < arr.length - 1 && styles.fieldDivider]}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <Text style={[styles.fieldValue, f.mono && { fontFamily: FontFamilies.mono, fontSize: 13 }]}>{f.value}</Text>
                </View>
              ))
            : [
                { label: 'M-Pesa code', value: tx.id, mono: true },
                { label: 'Type', value: tx.subType },
                { label: out ? 'Paid to' : 'Received from', value: tx.who },
                { label: 'Amount', value: `Ksh ${kes(Math.abs(tx.amount))}` },
                { label: 'Transaction cost', value: `Ksh ${kes(tx.cost)}` },
                { label: 'New M-Pesa balance', value: `Ksh ${kes(tx.balance)}` },
              ].map((f, i, arr) => (
                <View key={f.label} style={[styles.fieldRow, i < arr.length - 1 && styles.fieldDivider]}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <Text style={[styles.fieldValue, f.mono && { fontFamily: FontFamilies.mono, fontSize: 13 }]}>{f.value}</Text>
                </View>
              ))
          }
        </View>

        {/* Note */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardRow}>
            <Text style={styles.sectionLabel}>NOTE</Text>
            <Text style={{ fontSize: 16 }}>📝</Text>
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            onFocus={() => setNoteFocused(true)}
            onBlur={handleNoteBlur}
            multiline
            placeholder="Add a note… e.g. what was this for?"
            placeholderTextColor={Colors.ink3}
            style={[styles.noteInput, noteFocused && styles.noteInputFocused]}
          />
        </View>

        {/* Raw SMS terminal block */}
        <View style={{ marginHorizontal: 16, marginBottom: 28 }}>
          <View style={styles.terminalHeader}>
            <View style={[styles.terminalDot, { backgroundColor: Colors.good }]} />
            <Text style={styles.sectionLabel}>AUTO-READ FROM SMS</Text>
          </View>
          <View style={styles.terminal}>
            <View style={styles.terminalTopRow}>
              <Text style={styles.terminalMpesa}>MPESA</Text>
              <Text style={styles.terminalMeta}> · {tx.dateIso} {tx.time}</Text>
            </View>
            <Text style={styles.terminalBody}>
              {tx.category === 'other'
                ? <Text style={styles.terminalInk}>{tx.rawSms}</Text>
                : <>
                    <Text style={styles.terminalCode}>{tx.id}</Text>
                    <Text style={styles.terminalInk}>{' Confirmed. '}</Text>
                    <Text style={styles.terminalGreen}>Ksh {kes(Math.abs(tx.amount))}</Text>
                    <Text style={styles.terminalInk}>
                      {out
                        ? ` ${tx.subType === 'Withdrawal' ? 'withdrawn from' : tx.subType === 'Buy Goods' ? 'paid to' : 'sent to'} `
                        : ' received from '}
                    </Text>
                    <Text style={styles.terminalInk}>{tx.who}</Text>
                    <Text style={styles.terminalInk}>. New M-PESA balance is </Text>
                    <Text style={styles.terminalGreen}>Ksh {kes(tx.balance)}</Text>
                    <Text style={styles.terminalInk}>.{tx.cost ? ` Transaction cost, Ksh ${kes(tx.cost)}.` : ''}</Text>
                  </>
              }
            </Text>
          </View>
          <Text style={styles.terminalFooter}>🛡️ Read on-device · never leaves your phone</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamilies.semiBold, fontSize: 15, color: Colors.ink },

  hero: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  heroDisc: { width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroName: { fontFamily: FontFamilies.display, fontSize: 22, color: Colors.ink },
  heroMeta: { fontFamily: FontFamilies.medium, fontSize: 13.5, color: Colors.ink3, marginTop: 4 },
  heroAmount: { fontFamily: FontFamilies.display, fontSize: 44, marginTop: 14, letterSpacing: -1.5 },

  card: { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.lg, padding: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontFamily: FontFamilies.semiBold, fontSize: 11, color: Colors.ink3, letterSpacing: 0.8, textTransform: 'uppercase' },
  editBtn: {},
  editBtnText: { fontFamily: FontFamilies.semiBold, fontSize: 13, color: Colors.ink2 },
  catPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  catChip: { borderWidth: 1.5, borderColor: Colors.border2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.pill },
  catChipText: { fontFamily: FontFamilies.semiBold, fontSize: 13, color: Colors.ink2 },

  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, paddingVertical: 13 },
  fieldDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldLabel: { fontFamily: FontFamilies.medium, fontSize: 13.5, color: Colors.ink3, flexShrink: 0 },
  fieldValue: { fontFamily: FontFamilies.semiBold, fontSize: 14, color: Colors.ink, textAlign: 'right', flex: 1 },

  noteInput: { width: '100%', minHeight: 56, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md, padding: 12, fontSize: 14, fontFamily: FontFamilies.regular, color: Colors.ink, marginTop: 12, textAlignVertical: 'top' },
  noteInputFocused: { borderColor: Colors.ink },

  terminalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, marginBottom: 10 },
  terminalDot: { width: 7, height: 7, borderRadius: 4 },
  terminal: { backgroundColor: Colors.codeBg, borderRadius: Radii.md, padding: 16 },
  terminalTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  terminalMpesa: { fontFamily: FontFamilies.semiBold, fontSize: 11, color: Colors.codeYellow, letterSpacing: 0.6 },
  terminalMeta: { fontFamily: FontFamilies.mono, fontSize: 11, color: Colors.codeDim },
  terminalBody: { fontFamily: FontFamilies.mono, fontSize: 12.5, lineHeight: 21 },
  terminalCode: { color: Colors.codeYellow },
  terminalInk: { color: Colors.codeInk },
  terminalGreen: { color: Colors.codeGreen },
  terminalFooter: { fontFamily: FontFamilies.medium, fontSize: 11.5, color: Colors.ink3, marginTop: 10, paddingLeft: 4 },
});
