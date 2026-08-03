// Public API of the Smoking Program. Threshold-era pure logic only —
// widget layer, program manifest structure, and IDB program-scoped
// state are deferred until the minimum program-runtime slot
// infrastructure lands (backlog item 13).

export {
  PEAK_END_HOURS,
  HURDLES,
  nicotinePctRemaining,
  getWormStage,
  getWormScale,
  crossedHurdles,
  nextHurdle,
} from './science';

export type { CleanHours, WormStage, Hurdle } from './science';
