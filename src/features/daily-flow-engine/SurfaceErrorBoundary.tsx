import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Silent error boundary wrapping one program surface. ADR 0009 §3
 * "every `shouldFire()` and every surface component wraps in an
 * engine-owned error boundary and drops silently on failure".
 *
 * When a wrapped child throws:
 *   - render output collapses to `null` (widget disappears)
 *   - other surfaces continue rendering unaffected
 *   - no fallback UI, no reload button, no user-visible stack trace
 *   - no console.error from this boundary (the app-level boundary at
 *     personal-os/src/app/ErrorBoundary.tsx already logs any error
 *     that escapes higher up)
 *
 * The React development runtime will still print the caught error to
 * the console in dev builds — that is React's own reporting and is
 * silenced in production. Production consumers see nothing.
 */
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class SurfaceErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Silent by design. ADR 0009 §3 — engine drops silently.
  }

  override render(): ReactNode {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
