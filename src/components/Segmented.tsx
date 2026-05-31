import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontFamilies, Radii } from '../theme/tokens';

interface Option { value: string; label: string; }

interface Props {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}

export function Segmented({ options, value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.item, active && styles.activeItem]}
            onPress={() => onChange(o.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface2,
    borderRadius: Radii.pill,
    padding: 3,
    gap: 2,
  },
  item: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  activeItem: {
    backgroundColor: Colors.ink,
  },
  label: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 13.5,
    color: Colors.ink2,
    letterSpacing: -0.1,
  },
  activeLabel: {
    color: '#fff',
  },
});
