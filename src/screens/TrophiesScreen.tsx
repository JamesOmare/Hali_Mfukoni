import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, FontFamilies, Radii, Shadows } from '../theme/tokens';
import { useTrophyStore } from '../store/useTrophyStore';
import { ScreenHeader } from '../components/ScreenHeader';
import { ProgressBar } from '../components/ProgressBar';

export function TrophiesScreen() {
  const { trophies } = useTrophyStore();
  const [layout, setLayout] = useState<'list' | 'shelf'>('list');

  const earned = trophies.filter(t => t.earned).length;
  const total = trophies.length;
  const ringPct = total > 0 ? earned / total : 0;
  const r = 25, c = 2 * Math.PI * r;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Trophies" sub="Your money milestones" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress banner */}
        <View style={[styles.banner, Shadows.card]}>
          <View style={styles.ringWrap}>
            <Svg width={60} height={60} viewBox="0 0 60 60" style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={30} cy={30} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={6} />
              <Circle
                cx={30} cy={30} r={r}
                fill="none"
                stroke={Colors.accent}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - ringPct)}
              />
            </Svg>
            <Text style={styles.ringEmoji}>🏆</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerCount}>{earned} of {total}</Text>
            <Text style={styles.bannerSub}>trophies earned · {total - earned} to go</Text>
          </View>
          <TouchableOpacity
            style={styles.layoutToggle}
            onPress={() => setLayout(l => l === 'list' ? 'shelf' : 'list')}
          >
            <Text style={styles.layoutToggleText}>{layout === 'list' ? '⊞' : '≡'}</Text>
          </TouchableOpacity>
        </View>

        {layout === 'list'
          ? <ListView trophies={trophies} />
          : <ShelfView trophies={trophies} />}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function ListView({ trophies }: { trophies: import('../store/useTrophyStore').TrophyDef[] }) {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {trophies.map((tr, i) => (
        <View key={tr.id} style={[styles.listRow, i < trophies.length - 1 && styles.listDivider]}>
          <View style={[
            styles.listDisc,
            { backgroundColor: tr.earned ? tr.tint : Colors.surface2 },
            tr.earned && { shadowColor: tr.tint, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 5 },
          ]}>
            <Text style={[styles.discEmoji, !tr.earned && styles.greyscale]}>{tr.emoji}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.trophyName, !tr.earned && styles.dimText]}>{tr.name}</Text>
            <Text style={styles.trophyCond}>{tr.cond}</Text>
            {!tr.earned && tr.target != null && (
              <View style={{ marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, maxWidth: 120 }}>
                  <ProgressBar pct={(tr.progress / tr.target) * 100} height={5} color={tr.tint} />
                </View>
                <Text style={styles.progressText}>{tr.progress}/{tr.target}</Text>
              </View>
            )}
          </View>
          <View style={styles.statusBadge}>
            {tr.earned
              ? <View style={[styles.checkCircle, { backgroundColor: tr.tint }]}><Text style={{ color: '#fff', fontSize: 13 }}>✓</Text></View>
              : <Text style={styles.lock}>🔒</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

function ShelfView({ trophies }: { trophies: import('../store/useTrophyStore').TrophyDef[] }) {
  return (
    <View style={styles.shelfGrid}>
      {trophies.map((tr, i) => (
        <View
          key={tr.id}
          style={[
            styles.shelfCard,
            { backgroundColor: tr.earned ? tr.tint + '14' : Colors.surface },
            { borderColor: tr.earned ? tr.tint + '40' : Colors.border },
            { borderWidth: tr.earned ? 1.5 : 1 },
          ]}
        >
          {!tr.earned && <Text style={styles.shelfLock}>🔒</Text>}
          <View style={[
            styles.shelfDisc,
            { backgroundColor: tr.earned ? tr.tint : Colors.surface2 },
            !tr.earned && styles.greyscale,
          ]}>
            <Text style={{ fontSize: 30 }}>{tr.emoji}</Text>
          </View>
          <Text style={[styles.shelfName, !tr.earned && styles.dimText]} numberOfLines={2}>{tr.name}</Text>
          <Text style={styles.shelfCond} numberOfLines={2}>{tr.cond}</Text>
          {tr.earned
            ? <Text style={[styles.earnedOn, { color: tr.tint }]}>✓ {tr.earnedOn}</Text>
            : tr.target != null && (
              <View style={{ marginTop: 8, width: '100%' }}>
                <ProgressBar pct={(tr.progress / tr.target) * 100} height={5} color={Colors.ink3} animate={false} />
                <Text style={styles.shelfProgress}>{tr.progress} / {tr.target}</Text>
              </View>
            )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  banner: { margin: 16, backgroundColor: Colors.ink, borderRadius: Radii.lg, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  ringWrap: { width: 60, height: 60, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringEmoji: { position: 'absolute', fontSize: 22 },
  bannerCount: { fontFamily: FontFamilies.display, fontSize: 24, color: '#fff' },
  bannerSub: { fontFamily: FontFamilies.medium, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  layoutToggle: { padding: 8 },
  layoutToggleText: { fontSize: 22, color: Colors.accent },

  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
  listDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  listDisc: { width: 50, height: 50, borderRadius: 15, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  discEmoji: { fontSize: 25 },
  trophyName: { fontFamily: FontFamilies.display, fontSize: 15.5, color: Colors.ink },
  dimText: { color: Colors.ink3 },
  trophyCond: { fontFamily: FontFamilies.medium, fontSize: 12.5, color: Colors.ink3, marginTop: 2 },
  progressText: { fontFamily: FontFamilies.semiBold, fontSize: 11, color: Colors.ink3 },
  statusBadge: { flexShrink: 0 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  lock: { fontSize: 17 },
  greyscale: { opacity: 0.4 },

  shelfGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  shelfCard: { width: '47%', borderRadius: Radii.lg, padding: 16, alignItems: 'center', position: 'relative' },
  shelfLock: { position: 'absolute', top: 12, right: 12, fontSize: 14 },
  shelfDisc: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  shelfName: { fontFamily: FontFamilies.display, fontSize: 14, color: Colors.ink, textAlign: 'center', marginBottom: 4 },
  shelfCond: { fontFamily: FontFamilies.medium, fontSize: 11, color: Colors.ink3, textAlign: 'center', lineHeight: 15, minHeight: 30 },
  earnedOn: { fontFamily: FontFamilies.semiBold, fontSize: 11, marginTop: 8 },
  shelfProgress: { fontFamily: FontFamilies.semiBold, fontSize: 10.5, color: Colors.ink3, marginTop: 4, textAlign: 'center' },
});
