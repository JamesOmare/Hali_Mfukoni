import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Colors, Radii } from '../theme/tokens';

interface Props {
  pct: number;
  height?: number;
  color?: string;
  trackColor?: string;
  animate?: boolean;
}

export function ProgressBar({
  pct,
  height = 12,
  color = Colors.accent,
  trackColor = Colors.surface2,
  animate = true,
}: Props) {
  const width = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(100, pct));

  useEffect(() => {
    if (animate) {
      Animated.timing(width, {
        toValue: clamped,
        duration: 700,
        useNativeDriver: false,
      }).start();
    } else {
      width.setValue(clamped);
    }
  }, [clamped, animate]);

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius: Radii.pill }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: Radii.pill,
            backgroundColor: color,
            width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: {},
});
