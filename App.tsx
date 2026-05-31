import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from './src/theme/tokens';
import { migrate } from './src/db/schema';
import { useTransactionStore } from './src/store/useTransactionStore';
import { useGoalStore } from './src/store/useGoalStore';
import { useTrophyStore } from './src/store/useTrophyStore';
import { useFulizaStore } from './src/store/useFulizaStore';
import { useMerchantRulesStore } from './src/store/useMerchantRulesStore';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { checkSmsPermission, scanInbox } from './src/sms/scanner';
import { startSmsListener } from './src/sms/listener';

const ONBOARDED_KEY = 'hm_onboarded';

export default function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(true);

  const loadTx = useTransactionStore(s => s.load);
  const loadGoals = useGoalStore(s => s.load);
  const loadTrophies = useTrophyStore(s => s.load);
  const loadFuliza = useFulizaStore(s => s.load);
  const loadRules  = useMerchantRulesStore(s => s.load);
  const transactions = useTransactionStore(s => s.transactions);
  const streak = useTransactionStore(s => s.streak);
  const weekTx = useTransactionStore(s => s.weekTx);
  const refresh = useTrophyStore(s => s.refresh);
  const weeklyGoal = useGoalStore(s => s.weekly);

  useEffect(() => {
    const init = async () => {
      // 1. Set up database
      await migrate();

      // 2. Load all stored data
      await Promise.all([loadGoals(), loadTx(), loadTrophies(), loadFuliza(), loadRules()]);

      // 3. Check onboarding state
      const ob = await AsyncStorage.getItem(ONBOARDED_KEY);
      if (!ob) {
        // Never onboarded — check if permission was somehow already granted
        const hasPerm = await checkSmsPermission();
        if (hasPerm) {
          // Permission exists, scan and mark as onboarded
          await scanInbox();
          await loadTx();
          await AsyncStorage.setItem(ONBOARDED_KEY, '1');
          setOnboarded(true);
        } else {
          setOnboarded(false);
        }
      } else {
        // Already onboarded — show UI immediately, scan in background
        const hasPerm = await checkSmsPermission();
        if (hasPerm) {
          // Don't await — let UI render first, scan runs in background
          scanInbox().then(result => {
            if (result.inserted > 0) loadTx();
          });
        }
      }

      // 4. Start real-time listener for new M-Pesa messages
      startSmsListener(async () => {
        await loadTx();
      });

      setReady(true);
    };
    init();
  }, []);

  // Refresh trophies whenever transactions change
  useEffect(() => {
    if (transactions.length === 0) return;
    const week = weekTx();
    const weekSpent = week.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    refresh(
      transactions.map(t => ({ amount: t.amount, dateIso: t.dateIso, time: t.time, subType: t.subType })),
      streak(),
      weekSpent,
      weeklyGoal,
    );
  }, [transactions.length]);

  const handleOnboarded = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, '1');
    await loadTx();
    setOnboarded(true);
  };

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.canvas} />
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.canvas }}>
        {!onboarded
          ? <OnboardingScreen onDone={handleOnboarded} />
          : <AppNavigator />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
