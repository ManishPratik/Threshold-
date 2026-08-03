export interface EditableSlotConfig {
  key: string;
  title: string;
  hint: string;
  def: string;
}

// Defaults verbatim from ac4b193~1:index.html lines 2784-2789.
export const DEFAULT_FR_QUOTE =
  'Each hour that passes is one less thing the trap gets to hold over you.';
export const DEFAULT_PLEDGE_BODY =
  'I have escaped the trap. Cigarettes gave me nothing to begin with. There is nothing to miss.';
export const DEFAULT_LAPSE_BODY =
  'A slip is not a return. It is a data point. Log the trigger and continue. A single lapse only becomes relapse if you decide it does.';
export const DEFAULT_DOPAMINE_BODY =
  'Nicotine does not give your brain pleasure. It hijacks your natural dopamine system, lowers your baseline, then charges you a cigarette every 45 minutes to feel normal again.\n\nBetween cigarettes, you feel worse than a non-smoker. The "relief" from smoking is just returning to the baseline a non-smoker has for free — all the time.';
export const DEFAULT_DOPAMINE_TRUTH =
  'Smoking right now will not make you feel good. It will make you feel slightly less bad — for 4 minutes. Then worse than you feel right now.';
export const DEFAULT_MANTRA =
  'Every clean hour is a brick in the person I am becoming. I do not negotiate with the parasite. I am the one who crossed the peak.';

// _EDIT_TEXT_CFG at ac4b193~1:index.html lines 4926-4931 preserved
// verbatim (key + title + hint + default). Extended with MANTRA which
// the Threshold source stores under a dedicated editor.
export const EDITABLE_SLOTS: readonly EditableSlotConfig[] = [
  {
    key: 'FR_QUOTE',
    title: 'Motivational Quote',
    hint:
      'One sentence that greets you on Today — the thing you want in your head when you open the app.',
    def: DEFAULT_FR_QUOTE,
  },
  {
    key: 'PLEDGE_BODY',
    title: 'Your Pledge',
    hint:
      'First-person. Why you quit. What smoking gave you (nothing) vs what it took. Read this out loud when it feels heavy.',
    def: DEFAULT_PLEDGE_BODY,
  },
  {
    key: 'LAPSE_BODY',
    title: 'Lapse Response',
    hint:
      'What you tell yourself if today does not go clean. Framing matters more than the slip.',
    def: DEFAULT_LAPSE_BODY,
  },
  {
    key: 'DOPAMINE_BODY',
    title: 'Dopamine Trap',
    hint:
      'The mechanism you want to remember about why nicotine feels like relief but is actually a bill.',
    def: DEFAULT_DOPAMINE_BODY,
  },
  {
    key: 'DOPAMINE_TRUTH',
    title: 'The Truth Line',
    hint:
      'The one-line rebuttal to a craving. Blunt. Specific. Uncomfortable if it works.',
    def: DEFAULT_DOPAMINE_TRUTH,
  },
  {
    key: 'MANTRA',
    title: 'Your Mantra',
    hint: 'A line you can repeat to yourself when a craving lands.',
    def: DEFAULT_MANTRA,
  },
];

export function editableSlotByKey(
  key: string,
): EditableSlotConfig | undefined {
  return EDITABLE_SLOTS.find((s) => s.key === key);
}
