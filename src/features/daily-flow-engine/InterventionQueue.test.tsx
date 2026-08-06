import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import { deleteDb } from '@data/db/client';
import { clearRegistry, registerProgram } from '@features/programs';
import type { Intervention } from '@contract/program';
import { InterventionQueue } from './InterventionQueue';
import { markAcked, readAckRecord } from './ackLog';

// Test-only fake interventions. Kept inside this test file so no
// production code path ever references them. Vitest excludes
// `*.test.*` from the app bundle.
function fireAlways(): true {
  return true;
}
function fireNever(): false {
  return false;
}
function fireThrows(): never {
  throw new Error('boom-from-fake-intervention');
}

function makeIntervention(
  overrides: Partial<Intervention> & Pick<Intervention, 'id' | 'programId'>,
): Intervention {
  return {
    title: overrides.id,
    body: '',
    phase: 'morning',
    priority: 'p1',
    ackKind: 'per-day',
    shouldFire: fireAlways,
    ...overrides,
  };
}

// Pin the current time so `resolvePhase(nowIso)` inside the queue
// resolves deterministically to 'morning' regardless of when the
// test runs. `toFake: ['Date']` is critical — mocking setTimeout /
// setInterval would starve the IDB event loop and stall every test.
function pinMorningClock() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-08-03T09:00:00'));
}

describe('InterventionQueue integration', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(async () => {
    await deleteDb();
    clearRegistry();
    pinMorningClock();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(async () => {
    vi.useRealTimers();
    clearRegistry();
    await deleteDb();
    errorSpy.mockRestore();
  });

  it('renders nothing when no programs are enabled (empty-queue negative case)', async () => {
    const { container } = render(<InterventionQueue promiseId="p-1" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders nothing when enabled programs declare no interventions', async () => {
    registerProgram({
      id: 'noiv',
      displayName: 'No intervention program',
      description: 'test',
    });
    await new AppStateRepository().setEnabledProgramIds(['noiv']);

    const { container } = render(<InterventionQueue promiseId="p-1" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders exactly one intervention when one fake P1 program fires', async () => {
    registerProgram({
      id: 'fake-a',
      displayName: 'Fake A',
      description: 'test',
      interventions: [
        makeIntervention({
          id: 'iv-a',
          programId: 'fake-a',
          title: 'Read your Promise',
          body: 'One line. One breath.',
          priority: 'p1',
        }),
      ],
    });
    await new AppStateRepository().setEnabledProgramIds(['fake-a']);

    render(<InterventionQueue promiseId="p-1" />);
    await waitFor(() => {
      expect(screen.getByLabelText('Read your Promise')).toBeInTheDocument();
    });
    expect(screen.getByText('One line. One breath.')).toBeInTheDocument();
    // Only one card — the queue rendered no extras and no placeholder.
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('drops an intervention whose shouldFire throws; other interventions still render', async () => {
    registerProgram({
      id: 'crashy',
      displayName: 'Crashy',
      description: 'test',
      interventions: [
        makeIntervention({
          id: 'iv-boom',
          programId: 'crashy',
          title: 'This should never show',
          shouldFire: fireThrows,
          priority: 'p1',
        }),
        makeIntervention({
          id: 'iv-safe',
          programId: 'crashy',
          title: 'This survives',
          shouldFire: fireAlways,
          priority: 'p2',
        }),
      ],
    });
    await new AppStateRepository().setEnabledProgramIds(['crashy']);

    render(<InterventionQueue promiseId="p-1" />);
    await waitFor(() => {
      expect(screen.getByLabelText('This survives')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('This should never show')).toBeNull();
  });

  it('skips interventions whose shouldFire returns false', async () => {
    registerProgram({
      id: 'skippy',
      displayName: 'Skippy',
      description: 'test',
      interventions: [
        makeIntervention({
          id: 'iv-off',
          programId: 'skippy',
          title: 'Silent',
          shouldFire: fireNever,
        }),
      ],
    });
    await new AppStateRepository().setEnabledProgramIds(['skippy']);

    const { container } = render(<InterventionQueue promiseId="p-1" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('filters by current phase — an evening-anchored intervention does not fire in morning context', async () => {
    registerProgram({
      id: 'phased',
      displayName: 'Phased',
      description: 'test',
      interventions: [
        makeIntervention({
          id: 'iv-evening',
          programId: 'phased',
          title: 'Evening only',
          phase: 'evening',
        }),
      ],
    });
    await new AppStateRepository().setEnabledProgramIds(['phased']);

    const { container } = render(<InterventionQueue promiseId="p-1" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('filters out interventions already acked today on initial render', async () => {
    registerProgram({
      id: 'fake-b',
      displayName: 'Fake B',
      description: 'test',
      interventions: [
        makeIntervention({
          id: 'iv-b',
          programId: 'fake-b',
          title: 'Already done',
        }),
      ],
    });
    await new AppStateRepository().setEnabledProgramIds(['fake-b']);
    await markAcked('iv-b', '2026-08-03', 'ack');

    const { container } = render(<InterventionQueue promiseId="p-1" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('filters out interventions already dismissed today on initial render', async () => {
    registerProgram({
      id: 'fake-c',
      displayName: 'Fake C',
      description: 'test',
      interventions: [
        makeIntervention({
          id: 'iv-c',
          programId: 'fake-c',
          title: 'Already dismissed',
        }),
      ],
    });
    await new AppStateRepository().setEnabledProgramIds(['fake-c']);
    await markAcked('iv-c', '2026-08-03', 'dismiss');

    const { container } = render(<InterventionQueue promiseId="p-1" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('clicking Done acks the intervention and removes it from the queue', async () => {
    registerProgram({
      id: 'fake-d',
      displayName: 'Fake D',
      description: 'test',
      interventions: [
        makeIntervention({
          id: 'iv-d',
          programId: 'fake-d',
          title: 'Read the Pledge',
        }),
      ],
    });
    await new AppStateRepository().setEnabledProgramIds(['fake-d']);

    render(<InterventionQueue promiseId="p-1" />);
    await waitFor(() => {
      expect(screen.getByLabelText('Read the Pledge')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /Done — acknowledge Read the Pledge/i,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Read the Pledge')).toBeNull();
    });
    const record = await readAckRecord('2026-08-03');
    expect(record?.acked).toEqual(['iv-d']);
    expect(record?.dismissed).toEqual([]);
  });

  it('clicking Dismiss records a dismiss (not an ack) and removes it from the queue', async () => {
    registerProgram({
      id: 'fake-e',
      displayName: 'Fake E',
      description: 'test',
      interventions: [
        makeIntervention({
          id: 'iv-e',
          programId: 'fake-e',
          title: 'Reflect tonight',
        }),
      ],
    });
    await new AppStateRepository().setEnabledProgramIds(['fake-e']);

    render(<InterventionQueue promiseId="p-1" />);
    await waitFor(() => {
      expect(screen.getByLabelText('Reflect tonight')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Dismiss Reflect tonight/i }),
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Reflect tonight')).toBeNull();
    });
    const record = await readAckRecord('2026-08-03');
    expect(record?.dismissed).toEqual(['iv-e']);
    expect(record?.acked).toEqual([]);
  });

  it('one intervention acked does not hide a sibling still un-acked', async () => {
    registerProgram({
      id: 'fake-multi',
      displayName: 'Fake Multi',
      description: 'test',
      interventions: [
        makeIntervention({ id: 'iv-x', programId: 'fake-multi', title: 'One' }),
        makeIntervention({
          id: 'iv-y',
          programId: 'fake-multi',
          title: 'Two',
          priority: 'p2',
        }),
      ],
    });
    await new AppStateRepository().setEnabledProgramIds(['fake-multi']);

    render(<InterventionQueue promiseId="p-1" />);
    await waitFor(() => {
      expect(screen.getByLabelText('One')).toBeInTheDocument();
      expect(screen.getByLabelText('Two')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Done — acknowledge One/i }),
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('One')).toBeNull();
    });
    expect(screen.getByLabelText('Two')).toBeInTheDocument();
  });
});
