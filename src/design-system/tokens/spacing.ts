// 4pt base scale. Use these tokens instead of raw pixel values in components.
// If a value you need isn't here, add it here — do NOT introduce ad-hoc pixel values.

export const spacing = {
  '0': '0',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
  '32': '128px',
} as const;

export type SpacingToken = keyof typeof spacing;
