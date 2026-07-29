// Light-theme palette. Dark mode is intentionally OUT of V1 (locked decision).
// All foreground/background pairs used together must clear WCAG AA (4.5:1 for body text).
// Verify with any contrast checker before adding new pairs.

export const colors = {
  // Surfaces
  surfaceBase: '#ffffff',
  surfaceSubtle: '#fafafa',
  surfaceElevated: '#ffffff',
  surfaceInset: '#f5f5f5',

  // Foreground (all AA on surfaceBase)
  textPrimary: '#0a0a0a', // 20.4:1 on white
  textSecondary: '#4a4a4a', // 8.9:1 on white
  textMuted: '#6b7280', // 4.83:1 on white (borderline AA — reserve for large text/labels)
  textInverse: '#ffffff',

  // Borders
  borderSubtle: '#e5e7eb',
  borderStrong: '#d1d5db',
  borderFocus: '#2563eb',

  // Interactive accent (deep blue — calm, AA on white)
  accent: '#2563eb', // 4.56:1 on white
  accentHover: '#1d4ed8', // 6.34:1 on white
  accentPressed: '#1e40af', // 8.24:1 on white
  accentSubtle: '#eff6ff',

  // Semantic
  success: '#15803d', // 5.02:1 on white
  successSubtle: '#f0fdf4',
  warning: '#b45309', // 4.79:1 on white
  warningSubtle: '#fffbeb',
  danger: '#b91c1c', // 6.16:1 on white
  dangerSubtle: '#fef2f2',
  info: '#0369a1', // 6.13:1 on white
  infoSubtle: '#f0f9ff',

  // Overlay / scrim
  overlay: 'rgba(10, 10, 10, 0.5)',
} as const;

export type ColorToken = keyof typeof colors;
