export const colors = {
  bg: '#0A1420',
  bgRadialInner: '#132537',
  surface: '#132537',
  surfaceAlt: '#0F2033',
  surfaceAlt2: '#0F1E2E',
  textPrimary: '#E4F1FA',
  textBody: '#B9D4E8',
  textMuted: '#5B7A94',
  textMutedDark: '#3E5C74',
  red: '#FF3864',
  amber: '#FFC300',
  teal: '#00E0B8',
  orange: '#FF7A1A',
  violet: '#7B61FF',
  cyan: '#00D9FF',
  disabled: '#5a4270',
  onAccent: '#0A1420',
  white: '#FFFFFF',
} as const;

export const playerColors = [
  colors.red,
  colors.amber,
  colors.teal,
  colors.orange,
  colors.violet,
  colors.cyan,
  '#2EC4B6',
];

export const gradients = {
  primary: [colors.red, colors.orange] as const,
};

export const radii = {
  sm: 7,
  md: 8,
  lg: 9,
  xl: 10,
};

export const fonts = {
  heading: 'Rubik_600SemiBold',
  headingBold: 'Rubik_700Bold',
  headingExtraBold: 'Rubik_800ExtraBold',
  headingMedium: 'Rubik_500Medium',
  body: 'SpaceGrotesk_400Regular',
  bodyMedium: 'SpaceGrotesk_500Medium',
  bodySemiBold: 'SpaceGrotesk_600SemiBold',
  bodyBold: 'SpaceGrotesk_700Bold',
};

export const shadows = {
  neonGreen: {
    shadowColor: 'rgba(0,224,184,0.2)',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  cta: {
    shadowColor: colors.red,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
