import { registerProgram } from '@features/programs';
import { SmokingTodayWidget } from './SmokingTodayWidget';

registerProgram({
  id: 'smoking',
  displayName: 'Smoking Cessation',
  description:
    'Threshold. Nicotine clearance, peak-withdrawal countdown, and the ' +
    'post-peak hurdles chain that turns days into evidence.',
  todayWidget: SmokingTodayWidget,
});
