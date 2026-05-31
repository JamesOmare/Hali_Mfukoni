import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type Style = 'arc' | 'ring' | 'bar';

interface Props {
  pct: number;
  style?: Style;
  strokeColor: string;
  trackColor: string;
}

export function Gauge({ pct, style = 'arc', strokeColor, trackColor }: Props) {
  const p = Math.max(0, Math.min(100, pct));

  if (style === 'ring') {
    const r = 52;
    const c = 2 * Math.PI * r;
    return (
      <Svg width={132} height={132} viewBox="0 0 132 132" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={66} cy={66} r={r} fill="none" stroke={trackColor} strokeWidth={13} />
        <Circle
          cx={66} cy={66} r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
        />
      </Svg>
    );
  }

  if (style === 'arc') {
    const r = 70;
    const c = Math.PI * r;
    return (
      <Svg width={180} height={100} viewBox="0 0 180 100">
        <Path d={`M 16 92 A ${r} ${r} 0 0 1 164 92`} fill="none" stroke={trackColor} strokeWidth={14} strokeLinecap="round" />
        <Path
          d={`M 16 92 A ${r} ${r} 0 0 1 164 92`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
        />
      </Svg>
    );
  }

  // bar — handled by ProgressBar component
  return null;
}
