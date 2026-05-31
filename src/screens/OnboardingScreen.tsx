import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, FontFamilies, Radii, Shadows } from '../theme/tokens';
import { AppLogo } from '../components/AppLogo';
import { requestSmsPermissions, scanInbox } from '../sms/scanner';

interface Props {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: Props) {
  const [state, setState] = useState<'idle' | 'scanning' | 'done' | 'denied'>('idle');
  const [count, setCount] = useState(0);

  const handleGrant = async () => {
    const granted = await requestSmsPermissions();
    if (!granted) {
      setState('denied');
      return;
    }
    setState('scanning');
    const result = await scanInbox();
    setCount(result.inserted);
    setState('done');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.logoWrap}>
        <AppLogo size={84} />
        <Text style={styles.appName}>Hali Mfukoni</Text>
        <Text style={styles.tagline}>The state of your wallet</Text>
      </View>

      <View style={styles.card}>
        {state === 'idle' && (
          <>
            <Text style={styles.cardTitle}>Read your M-Pesa messages</Text>
            <Text style={styles.cardBody}>
              Hali Mfukoni reads only messages from MPESA to track your spending automatically.
              {'\n\n'}Your messages never leave your device — everything stays offline.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleGrant}>
              <Text style={styles.primaryBtnText}>Grant permission & scan inbox</Text>
            </TouchableOpacity>
          </>
        )}

        {state === 'scanning' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={[styles.cardTitle, { marginTop: 20 }]}>Scanning your inbox…</Text>
            <Text style={styles.cardBody}>Looking for M-Pesa messages</Text>
          </View>
        )}

        {state === 'done' && (
          <>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.cardTitle}>Karibu! You're all set</Text>
            <Text style={styles.cardBody}>
              Found {count} M-Pesa transaction{count !== 1 ? 's' : ''} in your inbox.
              New messages will be tracked automatically.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={onDone}>
              <Text style={styles.primaryBtnText}>View my wallet →</Text>
            </TouchableOpacity>
          </>
        )}

        {state === 'denied' && (
          <>
            <Text style={styles.doneEmoji}>😞</Text>
            <Text style={styles.cardTitle}>Permission needed</Text>
            <Text style={styles.cardBody}>
              Without SMS permission, Hali Mfukoni can't read your M-Pesa messages.
              You can grant it from Settings, or continue without it.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleGrant}>
              <Text style={styles.primaryBtnText}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={onDone}>
              <Text style={styles.skipBtnText}>Continue without SMS tracking</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 80, height: 80, borderRadius: 22, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...Shadows.accent },
  logoLetter: { fontFamily: FontFamilies.display, fontSize: 44, color: Colors.accent },
  appName: { fontFamily: FontFamilies.display, fontSize: 32, color: Colors.ink, letterSpacing: -1 },
  tagline: { fontFamily: FontFamilies.medium, fontSize: 15, color: Colors.ink3, marginTop: 6 },
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.xl, padding: 28, ...Shadows.card },
  center: { alignItems: 'center', paddingVertical: 20 },
  cardTitle: { fontFamily: FontFamilies.display, fontSize: 22, color: Colors.ink, marginBottom: 14 },
  cardBody: { fontFamily: FontFamilies.regular, fontSize: 15, color: Colors.ink2, lineHeight: 23, marginBottom: 28 },
  primaryBtn: { backgroundColor: Colors.ink, borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center', ...Shadows.card },
  primaryBtnText: { fontFamily: FontFamilies.semiBold, fontSize: 16, color: Colors.accent },
  skipBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 12 },
  skipBtnText: { fontFamily: FontFamilies.medium, fontSize: 14, color: Colors.ink3 },
  doneEmoji: { fontSize: 48, marginBottom: 16, textAlign: 'center' },
});
