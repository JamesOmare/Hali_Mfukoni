import React from 'react';
import Svg, { Path, Line, Polyline, Rect, Circle } from 'react-native-svg';

interface IconProps {
  name: keyof typeof ICONS;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const ICONS = {
  home: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="9,22 9,12 15,12 15,22" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  receipt: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="9" y="3" width="6" height="4" rx="1" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="9" y1="16" x2="13" y2="16" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),
  chart: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),
  target: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw} />
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={sw} />
      <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth={sw} />
    </Svg>
  ),
  trophy: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15c-3.866 0-7-3.134-7-7h14c0 3.866-3.134 7-7 7z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="5" y1="8" x2="2" y2="8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="19" y1="8" x2="22" y2="8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),
  search: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={sw} />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),
  bell: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  arrowLeft: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="19" y1="12" x2="5" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Polyline points="12,19 5,12 12,5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  chevRight: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="9,18 15,12 9,6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  check: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="20,6 9,17 4,12" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  lock: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth={sw} />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),
  pencil: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  dots: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1" fill={color} />
      <Circle cx="12" cy="12" r="1" fill={color} />
      <Circle cx="12" cy="19" r="1" fill={color} />
    </Svg>
  ),
  flame: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  trendUp: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="23,6 13.5,15.5 8.5,10.5 1,18" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="17,6 23,6 23,12" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  trendDown: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="23,18 13.5,8.5 8.5,13.5 1,6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="17,18 23,18 23,12" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  barsChart: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" />
      <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" />
    </Svg>
  ),
  donutChart: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={sw} strokeDasharray="20 31" strokeDashoffset="-5" />
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={sw} />
    </Svg>
  ),
  refresh: ({ size, color, sw }: P) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 4v6h-6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M1 20v-6h6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
};

type P = { size: number; color: string; sw: number };

export function HMIcon({ name, size = 20, color = '#15171B', strokeWidth = 2 }: IconProps) {
  const IconComponent = ICONS[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} color={color} sw={strokeWidth} />;
}
