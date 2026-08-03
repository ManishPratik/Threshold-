import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import { deleteDb } from '@data/db/client';
import { clearRegistry, registerProgram } from './registry';
import { TodayProgramWidgets } from './TodayProgramWidgets';

// Test-only fake surfaces. Kept inside this test file so no production
// code path ever references the throwing component. Nothing here ships
// to the runtime bundle — Vitest excludes *.test.* from the app build.
function OkA({ promiseId }: { promiseId: string }) {
  return <div data-testid="ok-a">okA:{promiseId}</div>;
}
function OkB({ promiseId }: { promiseId: string }) {
  return <div data-testid="ok-b">okB:{promiseId}</div>;
}
function Boom(): never {
  throw new Error('boom-from-fake-program');
}

describe('TodayProgramWidgets integration with Daily Flow Engine', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(async () => {
    await deleteDb();
    clearRegistry();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(async () => {
    clearRegistry();
    await deleteDb();
    errorSpy.mockRestore();
  });

  it('renders nothing when no programs are enabled', async () => {
    const { container } = render(<TodayProgramWidgets promiseId="p-1" />);
    await waitFor(() => {
      // Effect resolves with [] → component returns null.
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders a legacy todayWidget through the ambient alias', async () => {
    registerProgram({
      id: 'legacy-a',
      displayName: 'Legacy A',
      description: 'test',
      todayWidget: OkA,
    });
    await new AppStateRepository().setEnabledProgramIds(['legacy-a']);

    render(<TodayProgramWidgets promiseId="p-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('ok-a')).toBeInTheDocument();
    });
    expect(screen.getByTestId('ok-a').textContent).toBe('okA:p-1');
  });

  it('renders an explicit ambient surface program', async () => {
    registerProgram({
      id: 'modern-b',
      displayName: 'Modern B',
      description: 'test',
      surfaces: [{ slot: 'ambient', component: OkB, weight: 0 }],
    });
    await new AppStateRepository().setEnabledProgramIds(['modern-b']);

    render(<TodayProgramWidgets promiseId="p-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('ok-b')).toBeInTheDocument();
    });
  });

  it('isolates a throwing program: only that widget disappears; every other widget still renders', async () => {
    registerProgram({
      id: 'ok-a',
      displayName: 'Ok A',
      description: 'test',
      todayWidget: OkA,
    });
    registerProgram({
      id: 'crashy',
      displayName: 'Crashy',
      description: 'test',
      todayWidget: Boom,
    });
    registerProgram({
      id: 'ok-b',
      displayName: 'Ok B',
      description: 'test',
      todayWidget: OkB,
    });
    await new AppStateRepository().setEnabledProgramIds([
      'ok-a',
      'crashy',
      'ok-b',
    ]);

    const { container } = render(<TodayProgramWidgets promiseId="p-2" />);
    await waitFor(() => {
      expect(screen.getByTestId('ok-a')).toBeInTheDocument();
    });
    // The two ok programs must still render.
    expect(screen.getByTestId('ok-a')).toBeInTheDocument();
    expect(screen.getByTestId('ok-b')).toBeInTheDocument();
    // The crashy program's widget must have disappeared silently — no
    // fallback text, no error banner, no reload button.
    expect(container.textContent).not.toContain('boom-from-fake-program');
    expect(container.textContent).not.toContain('Something went wrong');
  });

  it('does not render legacy programs into slots other than ambient', async () => {
    // A legacy todayWidget only surfaces as ambient. It must not
    // accidentally appear when the engine (future phases) looks in
    // hero or overlay. This test guards that regression.
    registerProgram({
      id: 'legacy-a',
      displayName: 'Legacy A',
      description: 'test',
      todayWidget: OkA,
    });
    await new AppStateRepository().setEnabledProgramIds(['legacy-a']);
    render(<TodayProgramWidgets promiseId="p-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('ok-a')).toBeInTheDocument();
    });
    // No hero-slot render tree exists in this integration phase — the
    // widget above is ambient. This assertion documents the invariant
    // for future phases: only one instance rendered.
    expect(screen.getAllByTestId('ok-a')).toHaveLength(1);
  });

  it('skips programs whose id is enabled but not registered', async () => {
    // No program registered under this id.
    await new AppStateRepository().setEnabledProgramIds(['ghost']);
    const { container } = render(<TodayProgramWidgets promiseId="p-1" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
