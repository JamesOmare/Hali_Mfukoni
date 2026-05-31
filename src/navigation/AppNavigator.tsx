import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { Colors, FontFamilies, Radii } from '../theme/tokens';
import { HMIcon } from '../components/HMIcon';
import { HomeScreen } from '../screens/HomeScreen';
import { ListScreen } from '../screens/ListScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { TrophiesScreen } from '../screens/TrophiesScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { useTransactionStore } from '../store/useTransactionStore';

type Tab = 'Home' | 'Activity' | 'Stats' | 'Goals' | 'Trophies';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'Home',     icon: 'home',    label: 'Home' },
  { key: 'Activity', icon: 'receipt', label: 'Activity' },
  { key: 'Stats',    icon: 'chart',   label: 'Stats' },
  { key: 'Goals',    icon: 'target',  label: 'Goals' },
  { key: 'Trophies', icon: 'trophy',  label: 'Trophies' },
];

export function AppNavigator() {
  const [tab, setTab] = useState<Tab>('Home');
  const [detailId, setDetailId] = useState<string | null>(null);
  const transactions = useTransactionStore(s => s.transactions);

  const openTx = (id: string) => setDetailId(id);
  const closeTx = () => setDetailId(null);
  const goTab = (t: string) => { setDetailId(null); setTab(t as Tab); };

  // Intercept Android back button — go back to list instead of exiting the app
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (detailId) { closeTx(); return true; }
      return false; // no detail open → let Android exit normally
    });
    return () => sub.remove();
  }, [detailId]);

  const tx = detailId ? transactions.find(t => t.id === detailId) ?? null : null;

  if (tx) {
    return <DetailScreen tx={tx} onBack={closeTx} />;
  }

  return (
    <View style={styles.root}>
      {/* All screens stay mounted — display:none hides without unmounting */}
      <View style={[styles.screen, tab !== 'Home'     && styles.hidden]}>
        <HomeScreen onOpenTx={openTx} onGoTab={goTab} />
      </View>
      <View style={[styles.screen, tab !== 'Activity' && styles.hidden]}>
        <ListScreen onOpenTx={openTx} />
      </View>
      <View style={[styles.screen, tab !== 'Stats'    && styles.hidden]}>
        <StatsScreen onGoTab={goTab} />
      </View>
      <View style={[styles.screen, tab !== 'Goals'    && styles.hidden]}>
        <GoalsScreen />
      </View>
      <View style={[styles.screen, tab !== 'Trophies' && styles.hidden]}>
        <TrophiesScreen />
      </View>

      <View style={styles.tabBar}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tabItem}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.tabPill, active && styles.tabPillActive]}>
                <HMIcon
                  name={t.icon as any}
                  size={21}
                  color={active ? Colors.onAccent : Colors.ink3}
                  strokeWidth={active ? 2.3 : 2}
                />
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.canvas },
  screen:        { flex: 1 },
  hidden:        { display: 'none' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 6,
  },
  tabItem:       { flex: 1, alignItems: 'center', gap: 4 },
  tabPill: {
    width: 52,
    height: 30,
    borderRadius: 15,       // exactly half of height → perfect capsule
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: { backgroundColor: Colors.accent },
  tabLabel: {
    fontFamily: FontFamilies.medium,
    fontSize: 10.5,
    color: Colors.ink3,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    fontFamily: FontFamilies.semiBold,
    color: Colors.ink,
  },
});
