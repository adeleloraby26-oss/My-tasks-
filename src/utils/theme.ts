export const COLORS = {
  // Brand colors matching the app screenshots
  blue:   '#4A90E2',
  green:  '#27AE60',
  orange: '#F39C12',
  purple: '#8E44AD',
  red:    '#E74C3C',
  teal:   '#1ABC9C',
  pink:   '#E91E8C',

  // Board card gradients
  boardColors: [
    ['#4A90E2', '#357ABD'],
    ['#27AE60', '#1E8449'],
    ['#F39C12', '#D68910'],
    ['#8E44AD', '#6C3483'],
    ['#E74C3C', '#C0392B'],
    ['#1ABC9C', '#17A589'],
  ] as [string, string][],
} as const;

export const DARK_THEME = {
  // AMOLED true black
  bg:           '#000000',
  bgCard:       '#0D0D0D',
  bgCardAlt:    '#111111',
  bgInput:      '#1A1A1A',
  border:       '#2A2A2A',
  text:         '#FFFFFF',
  textSub:      '#AAAAAA',
  textMuted:    '#666666',
  accent:       '#4A90E2',
  statusBar:    'light' as const,
};

export const LIGHT_THEME = {
  bg:           '#F5F5F5',
  bgCard:       '#FFFFFF',
  bgCardAlt:    '#F0F0F0',
  bgInput:      '#EBEBEB',
  border:       '#E0E0E0',
  text:         '#111111',
  textSub:      '#555555',
  textMuted:    '#999999',
  accent:       '#4A90E2',
  statusBar:    'dark' as const,
};

export type Theme = typeof DARK_THEME;

export const FONTS = {
  regular:  'System',
  medium:   'System',
  bold:     'System',
  sizes: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  24,
    xxxl: 32,
  },
} as const;

export const RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  full: 999,
} as const;

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
} as const;
