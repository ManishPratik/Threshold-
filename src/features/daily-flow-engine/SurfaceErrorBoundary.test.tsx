import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SurfaceErrorBoundary } from './SurfaceErrorBoundary';

function Throwing(): never {
  throw new Error('boom');
}
function Ok() {
  return <div data-testid="ok">ok</div>;
}

describe('SurfaceErrorBoundary', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    // React logs any caught render error to the console in dev builds.
    // Silence it inside these tests so the intentional throws do not
    // pollute the test output.
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('renders children normally when no error is thrown', () => {
    render(
      <SurfaceErrorBoundary>
        <Ok />
      </SurfaceErrorBoundary>,
    );
    expect(screen.getByTestId('ok')).toBeInTheDocument();
  });

  it('renders null when the child component throws', () => {
    const { container } = render(
      <SurfaceErrorBoundary>
        <Throwing />
      </SurfaceErrorBoundary>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('never shows a fallback UI on error (silent)', () => {
    const { container } = render(
      <SurfaceErrorBoundary>
        <Throwing />
      </SurfaceErrorBoundary>,
    );
    expect(container.textContent).toBe('');
  });
});
