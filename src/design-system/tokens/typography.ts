// System-font stack — zero webfont cost, native feel on every OS.
// Type scale is a rounded 1.25 modular scale, capped at 4xl.

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px', // base body
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  lineHeight: {
    xs: '16px',
    sm: '20px',
    md: '24px',
    lg: '28px',
    xl: '28px',
    '2xl': '32px',
    '3xl': '36px',
    '4xl': '44px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
} as const;

export type FontSizeToken = keyof typeof typography.fontSize;
export type FontWeightToken = keyof typeof typography.fontWeight;
