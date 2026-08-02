import type { CSSProperties, ReactNode } from 'react';

export interface CeremonialFadeProps {
  visible: boolean;
  /** When true, opacity flips instantly with no CSS transition. */
  reducedMotion?: boolean;
  children: ReactNode;
}

/**
 * Frozen-architecture CeremonialFade — presentation wrapper. Fades its
 * children in and out via `opacity` based on `visible`. Transition
 * duration reads from the semantic motion token
 * `--motion-ceremonial-in`. `reducedMotion` collapses it to instant.
 */
export function CeremonialFade({
  visible,
  reducedMotion = false,
  children,
}: CeremonialFadeProps) {
  const style: CSSProperties = reducedMotion
    ? { opacity: visible ? 1 : 0 }
    : {
        opacity: visible ? 1 : 0,
        transition:
          'opacity var(--motion-ceremonial-in) var(--motion-easing-out)',
      };
  return <div style={style}>{children}</div>;
}
