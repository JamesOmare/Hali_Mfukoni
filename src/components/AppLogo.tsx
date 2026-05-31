import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
}

/**
 * The Hali Mfukoni logo — dark rounded square, bold "H" in mint green,
 * small coin accent top-right. Matches the Android launcher icon exactly.
 */
export function AppLogo({ size = 80 }: Props) {
  const s = size;
  const r = s * 0.24;

  // H geometry (mirrors the Python generator)
  const pad  = s * 0.20;
  const sw   = s * 0.148;
  const cy   = s * 0.425;
  const ch   = s * 0.148;

  // Coin
  const cr  = s * 0.115;
  const ccx = s - pad - sw * 0.5;
  const ccy = pad - cr * 0.25;
  const ring = s * 0.018;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Background */}
      <Rect x={0} y={0} width={s} height={s} rx={r} ry={r} fill="#15171B" />

      {/* Left bar */}
      <Rect x={pad} y={pad} width={sw} height={s - 2 * pad} fill="#9DF5C4" />
      {/* Right bar */}
      <Rect x={s - pad - sw} y={pad} width={sw} height={s - 2 * pad} fill="#9DF5C4" />
      {/* Crossbar */}
      <Rect x={pad} y={cy} width={s - 2 * pad} height={ch} fill="#9DF5C4" />

      {/* Coin shadow ring */}
      <Circle cx={ccx} cy={ccy} r={cr + ring} fill="#15171B" />
      {/* Coin fill */}
      <Circle cx={ccx} cy={ccy} r={cr} fill="#5FE19C" />
      {/* Coin highlight */}
      <Circle cx={ccx - cr * 0.18} cy={ccy - cr * 0.3} r={cr * 0.32} fill="rgba(200,255,230,0.55)" />
    </Svg>
  );
}
