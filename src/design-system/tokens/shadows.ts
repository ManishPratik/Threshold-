// Elevation is used sparingly — the design brief is "calm, minimal".
// Prefer borders over shadows; use shadows only for genuinely floating surfaces.

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(10, 10, 10, 0.04)',
  md: '0 2px 4px 0 rgba(10, 10, 10, 0.06), 0 1px 2px 0 rgba(10, 10, 10, 0.04)',
  lg: '0 8px 16px -4px rgba(10, 10, 10, 0.08), 0 4px 8px -4px rgba(10, 10, 10, 0.06)',
  focus: '0 0 0 3px rgba(37, 99, 235, 0.35)', // matches colors.borderFocus at 35% alpha
} as const;

export type ShadowToken = keyof typeof shadows;
