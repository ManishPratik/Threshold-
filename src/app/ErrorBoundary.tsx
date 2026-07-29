import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Class boundary because React does not (yet) expose a hook equivalent.
// Any thrown render error inside App renders the fallback UI instead of a blank page.
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
     
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          style={{
            padding: '24px',
            maxWidth: 480,
            margin: '48px auto',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '20px', marginBottom: '12px' }}>Something went wrong</h1>
          <p style={{ color: '#4a4a4a', marginBottom: '16px' }}>
            Personal OS hit an unexpected error. Reload the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
