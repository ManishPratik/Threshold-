// Motion tokens — deliberately short. "Calm" means fast and unobtrusive, not slow.
// All animated components must respect prefers-reduced-motion (see global.css).

export const motion = {
  duration: {
    instant: '0ms',
    fast: '120ms',
    medium: '180ms',
    slow: '240ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)', // fast-out, slow-in (calm feel)
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  },
} as const;

export type DurationToken = keyof typeof motion.duration;
export type EasingToken = keyof typeof motion.easing;
