export const Colors = {
  canvas: '#FBFBF9',
  surface: '#FFFFFF',
  surface2: '#F4F4F1',
  border: '#ECECE7',
  border2: '#E0E0DA',
  ink: '#15171B',
  ink2: '#5A5C60',
  ink3: '#9A9C98',
  accent: '#9DF5C4',
  accentDeep: '#5FE19C',
  onAccent: '#15171B',
  good: '#12A45C',
  goodFill: '#E2F4EA',
  bad: '#EE4D2E',
  badFill: '#FCE7E1',
  codeBg: '#15171B',
  codeInk: '#E9EAE4',
  codeGreen: '#5BE6A0',
  codeYellow: '#9DF5C4',
  codeDim: '#6E726B',
} as const;

export const Radii = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  pill: 9999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#14161A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  accent: {
    shadowColor: '#5FE19C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 8,
  },
  bad: {
    shadowColor: '#EE4D2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 8,
  },
} as const;

export const FontFamilies = {
  display: 'SpaceGrotesk-Bold',
  semiBold: 'SpaceGrotesk-SemiBold',
  medium: 'SpaceGrotesk-Medium',
  regular: 'SpaceGrotesk-Regular',
  mono: 'SpaceMono-Regular',
} as const;
