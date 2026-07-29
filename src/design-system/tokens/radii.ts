export const radii = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  pill: '9999px',
} as const;

export type RadiusToken = keyof typeof radii;
