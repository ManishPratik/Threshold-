import { registerProgram } from '@features/programs';
import { SmokingTodayWidget } from './SmokingTodayWidget';
import { SMOKING_INTERVENTIONS } from './interventions';
import { preloadSmokingContext } from './interventionState';

registerProgram({
  id: 'smoking',
  displayName: 'Smoking Cessation',
  description:
    'Threshold. Nicotine clearance, peak-withdrawal countdown, and the ' +
    'post-peak hurdles chain that turns days into evidence.',
  surfaces: [
    {
      slot: 'ambient',
      component: SmokingTodayWidget,
      weight: 0,
    },
  ],
  interventions: SMOKING_INTERVENTIONS,
});

// Kick off the sync-context preload at manifest import time so the
// InterventionQueue at
// personal-os/src/features/daily-flow-engine/InterventionQueue.tsx:29-52
// observes a populated cache on its first render after mount. The
// promise is deliberately not awaited — module import must stay
// synchronous per the registerProgram side-effect contract at
// personal-os/src/features/programs/registry.ts:16-18.
void preloadSmokingContext();
