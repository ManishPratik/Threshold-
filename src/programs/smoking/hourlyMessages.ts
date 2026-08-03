export interface BodyMessage {
  icon: string;
  hour: string;
  text: string;
  feel: string;
}

// HOURLY_MSGS ported verbatim from ac4b193~1:index.html lines 2968-3078.
// Keyed by whole-hour offset since quit; Day-1 has every hour, Days 2-7
// have selected hour anchors.
export const HOURLY_MSGS: Readonly<Record<number, BodyMessage>> = {
  0: { icon: '🚀', hour: 'Hour 0 — Ignition', text: "You just cut off the parasite's food supply. Your body begins healing this second.", feel: 'You may feel nothing yet. The first cravings arrive within 2 hours.' },
  1: { icon: '⏱️', hour: 'Hour 1', text: 'Nicotine half-life has begun. Every 2 hours, half of what remains is eliminated.', feel: 'Still relatively comfortable. Enjoy this window.' },
  2: { icon: '🩸', hour: 'Hour 2 — First Battle', text: '50% of nicotine already gone from your blood. Heart rate and blood pressure dropping.', feel: 'First real cravings arriving now. This is normal. Each one lasts 3–5 minutes maximum.' },
  3: { icon: '❤️', hour: 'Hour 3', text: "Blood pressure dropping toward levels it hasn't seen in years. Heart working easier.", feel: 'May feel restless or irritable. Your brain is noticing the drop in nicotine.' },
  4: { icon: '🧠', hour: 'Hour 4 — Brain Shift', text: 'Nicotine receptors in your brain drop 33% activity. The rewiring has begun.', feel: "Cravings intensifying. Possible anxiety or fidgeting. This is the worm fighting back — it means you're winning." },
  5: { icon: '🌊', hour: 'Hour 5', text: 'Blood circulation improving to hands and feet. Your extremities warming up.', feel: "Tingling in fingers or toes is normal — that's circulation returning. Not distress. Recovery." },
  6: { icon: '💧', hour: 'Hour 6', text: "Blood sugar adjusting as body recalibrates without nicotine's metabolic interference.", feel: 'Possible hunger or lightheadedness. Drink water. Eat something light. Your metabolism is resetting.' },
  7: { icon: '🫁', hour: 'Hour 7', text: 'Airways beginning to relax. Bronchial tubes less constricted than an hour ago.', feel: "Each breath is slightly fuller than the last. You may not notice yet — but it's happening." },
  8: { icon: '🫀', hour: 'Hour 8 — Oxygen Milestone', text: 'Carbon monoxide in blood drops by HALF. Oxygen levels returning to normal. Brain getting cleaner fuel.', feel: 'Possible headache as blood vessels dilate with more oxygen. This is healing — not harm.' },
  9: { icon: '✨', hour: 'Hour 9', text: "Nerve cells beginning to recover from nicotine's chemical grip.", feel: 'Still uncomfortable? Good. Discomfort means the addiction is losing. Comfort would mean nothing was changing.' },
  10: { icon: '⚡', hour: 'Hour 10', text: '10 hours. Your body has been healing for 10 consecutive hours without pause.', feel: 'Energy may dip — blood sugar still adjusting. Not weakness. Recalibration.' },
  11: { icon: '🌅', hour: 'Hour 11', text: 'Almost half a day. The parasite has been starving for 11 hours straight.', feel: 'Cravings may feel random and sudden. They are. The brain is firing old patterns. Each one you resist weakens the pattern permanently.' },
  12: { icon: '🩺', hour: 'Hour 12 — Carbon Monoxide Clear', text: 'Carbon monoxide FULLY normalized. Your blood is now carrying its full designed oxygen load.', feel: "A subtle but real shift in how your head feels. The fog was always there — you just couldn't see it from inside." },
  13: { icon: '🎯', hour: 'Hour 13', text: 'Dopamine receptors beginning slow recalibration toward natural production.', feel: "May feel flat or low mood. Your brain's reward system is resetting. This passes." },
  14: { icon: '💪', hour: 'Hour 14', text: 'Physical energy beginning to return. Body no longer spending resources managing nicotine.', feel: 'Small windows of feeling genuinely okay. These will grow longer every day.' },
  15: { icon: '🧬', hour: 'Hour 15', text: 'Cellular repair accelerating. The body prioritizes healing when the toxin supply stops.', feel: 'Possible coughing — lungs beginning to clear debris. This is good. This is healing.' },
  16: { icon: '❤️', hour: 'Hour 16', text: 'Heart beating more efficiently. Less strain. Better output. Your cardiovascular system is relieved.', feel: 'Blood pressure measurably lower right now than when you were smoking.' },
  17: { icon: '🌙', hour: 'Hour 17', text: 'Sleep quality will improve tonight. Nicotine disrupts REM sleep — that disruption is ending.', feel: 'You may sleep more deeply tonight than you have in years. Let yourself rest.' },
  18: { icon: '🧠', hour: 'Hour 18', text: "Brain clarity measurably improving. The fog that felt normal — wasn't normal. That was nicotine.", feel: 'Mood may swing. Irritability is peak withdrawal. It is temporary and means the chemical hold is breaking.' },
  19: { icon: '💪', hour: 'Hour 19', text: 'Physical withdrawal approaching peak. The next few hours are the hardest. Hold.', feel: 'Intense craving possible. Use the craving button. This is the final push before Hour 24 changes everything.' },
  20: { icon: '🌟', hour: 'Hour 20', text: 'Brain oxygen at its highest level since you started smoking.', feel: 'Almost there. 4 more hours to Day 1 complete.' },
  21: { icon: '🫁', hour: 'Hour 21', text: 'Small airways in lungs relaxing and opening. Each breath reaching deeper.', feel: 'Possible tight chest or cough — mucus clearing. Your lungs are cleaning house.' },
  22: { icon: '⏳', hour: 'Hour 22', text: 'The body has been repairing itself for 22 consecutive hours.', feel: '2 hours to Day 1. You are almost at the first major psychological milestone.' },
  23: { icon: '🔥', hour: 'Hour 23', text: 'Nicotine almost entirely gone. The worm is gasping for what it cannot have.', feel: 'One more hour. After this, everything gets easier. This is a scientific fact.' },
  24: { icon: '🎖️', hour: 'Day 1 Complete — MILESTONE', text: 'Nicotine cleared from bloodstream. Blood pressure at normal level. Lungs clearing mucus. Taste and smell beginning to return.', feel: "You may feel proud — you should. Day 1 is where most people fail. You didn't." },
  26: { icon: '👃', hour: 'Day 2 — Hour 26', text: 'Nerve endings damaged by smoking beginning to regrow.', feel: 'Food may smell different. More vivid. This is your olfactory nerves coming back online.' },
  30: { icon: '🧬', hour: 'Day 2 — Hour 30', text: 'Taste receptors regenerating. Sense of smell sharpening hour by hour.', feel: 'You might notice smells you forgot existed. This will keep improving for weeks.' },
  36: { icon: '🌊', hour: 'Day 2 — Hour 36', text: 'Dopamine receptors actively recalibrating. Natural pleasure systems rebuilding.', feel: 'Mood may feel unstable — up and down. This is the reward system resetting. It is temporary.' },
  42: { icon: '⚡', hour: 'Day 2 — Hour 42', text: 'Circulation continuing to improve. Oxygen delivery to every organ increasing.', feel: 'Physical cravings still present but changing character — less physical demand, more habit-based.' },
  48: { icon: '✨', hour: 'Day 2 Complete — MILESTONE', text: '48 hours. Nerve endings regrowing. Nicotine byproducts clearing. Taste and smell significantly sharper.', feel: 'The hardest 48 hours of quitting are complete. What remains gets progressively easier.' },
  54: { icon: '🫁', hour: 'Day 3 — Hour 54', text: 'Bronchial tubes relaxing further. Breathing becomes measurably easier.', feel: 'Day 3 is peak withdrawal. You may feel the worst today. This is the turn — after today, it gets easier every single hour.' },
  60: { icon: '🌬️', hour: 'Day 3 — Hour 60', text: 'Lungs actively clearing mucus built up over years of smoking.', feel: "Coughing may increase today — this is not sickness. This is your lungs doing what they couldn't do while you smoked." },
  66: { icon: '💪', hour: 'Day 3 — Hour 66', text: 'Energy levels beginning a real recovery as body stops compensating for nicotine withdrawal.', feel: 'Headaches, irritability, intense cravings — all peak today. All of them will be weaker tomorrow. Science guarantees this.' },
  72: { icon: '🏆', hour: 'Day 3 Complete — MILESTONE', text: '72 hours. Nicotine FULLY eliminated from body. Peak withdrawal passed. The absolute worst is behind you.', feel: 'If you feel terrible right now — this is the peak. It does not get worse than this. Only better from here.' },
  78: { icon: '🧠', hour: 'Day 4 — Hour 78', text: 'Brain chemistry stabilizing. Nicotine receptors beginning to normalize.', feel: 'Noticeable improvement from yesterday. The cliff of withdrawal is behind you. Now it is a gradual slope.' },
  84: { icon: '✨', hour: 'Day 4 — Hour 84', text: 'Energy returning. Lung capacity increasing. Brain fog lifting.', feel: 'First real moments of genuine clarity. This is what your brain feels like without a chemical handicap.' },
  90: { icon: '🌟', hour: 'Day 4 — Hour 90', text: 'Circulation significantly improved. Exercise capacity noticeably better.', feel: "Cravings still come but shorter duration. Notice how quickly they pass when you don't act on them." },
  96: { icon: '🫁', hour: 'Day 4 Complete — MILESTONE', text: '4 days. Cilia in lungs regenerating. Breathing becoming easier. Nicotine receptor activity normalizing.', feel: 'The physical addiction is broken. What remains is habit and pattern. These are manageable.' },
  102: { icon: '💪', hour: 'Day 5 — Hour 102', text: 'Physical symptoms largely gone. The body has accepted its new chemistry.', feel: 'You may feel surprisingly normal today. This is not a trick. This is who you are without nicotine.' },
  108: { icon: '❤️', hour: 'Day 5 — Hour 108', text: 'Blood pressure stable at healthier levels. Heart attack risk already measurably lower than Day 1.', feel: 'Remember why you did this. Your BP. Your heart. This is working.' },
  114: { icon: '🧠', hour: 'Day 5 — Hour 114', text: 'Dopamine system recalibrating. Natural rewards beginning to feel rewarding again.', feel: 'Small pleasures — food, music, conversation — may feel more vivid. This is your reward system coming back.' },
  120: { icon: '🏆', hour: 'Day 5 Complete — MILESTONE', text: '5 DAYS. Circulation improved. Lungs clearing. Cravings manageable. You are past the hardest phase. The worm is dying.', feel: '5 days smoke-free. Everything from here is compounding evidence you are already the person you promised.' },
  132: { icon: '🧬', hour: 'Day 6', text: 'Lung function measurably increasing. Cilia repair accelerating.', feel: 'Physical cravings now rare. Remaining urges are psychological — habit patterns, not chemical need.' },
  144: { icon: '🎯', hour: 'Day 6 — Evening', text: 'Brain reward system actively recalibrating toward natural dopamine production.', feel: 'Notice how the day feels more even. Less peaks and valleys. This is your natural brain chemistry.' },
  156: { icon: '🌟', hour: 'Day 7 — Morning', text: 'One week approaching. Lung function up significantly. Taste and smell fully restored.', feel: 'One week is the first major milestone most people celebrate. You are almost there.' },
  168: { icon: '🏆', hour: 'Day 7 Complete — MILESTONE', text: '7 DAYS. One full week smoke-free. The hardest week of your life is done. The worm is dying.', feel: 'Statistically, making it 7 days means you are 9x more likely to succeed long-term. You are in the winning group.' },
};

// DAILY_MSGS ported verbatim from ac4b193~1:index.html lines 3121-3132.
// Anchored on day count (rounded down) once past Day 7.
export interface DailyMessage extends BodyMessage {
  day: number;
}

export const DAILY_MSGS: readonly DailyMessage[] = [
  { day: 8, icon: '🌬️', hour: 'Day 8', text: 'Lungs clearing faster. Breathing easier every morning. Cilia regenerating.', feel: 'Cravings now habit-based not chemical. Noticeably easier to resist.' },
  { day: 9, icon: '⚡', hour: 'Day 9', text: 'Energy levels rising as body fully adjusts to life without nicotine.', feel: 'You may feel more capable than you have in years. This is your baseline now.' },
  { day: 10, icon: '🧠', hour: 'Day 10', text: 'Nicotine receptors briefly overshoot — 26% above baseline. Unexpected cravings possible.', feel: 'If cravings feel suddenly strong today — this is the overshoot. It passes by Day 14.' },
  { day: 11, icon: '💪', hour: 'Day 11', text: 'Physical stamina measurably better. Cardiovascular efficiency improving.', feel: 'Exercise feels different. Lungs are working properly for the first time in years.' },
  { day: 12, icon: '🌟', hour: 'Day 12', text: 'Dopamine baseline rising. Natural joy returning without chemical assistance.', feel: 'Notice moments of genuine good mood. Not manufactured by nicotine. Real.' },
  { day: 13, icon: '🎯', hour: 'Day 13', text: 'Cravings becoming infrequent. Each one shorter and weaker than the last.', feel: 'The pattern is clear now — every day is easier than the one before.' },
  { day: 14, icon: '🏆', hour: 'Day 14', text: '2 weeks. Circulation at peak recovery. Lung function up 10-30%.', feel: 'Two weeks is when most people start to feel genuinely good. Not just less bad. Good.' },
  { day: 21, icon: '🧬', hour: 'Day 21', text: 'Nicotine receptors FULLY normalized. Brain chemistry is now that of a non-smoker.', feel: 'Day 21 is the brain reset milestone. The physical architecture of addiction has been dismantled.' },
  { day: 30, icon: '🫁', hour: 'Day 30', text: '1 month. Lung function up 10%. Coughing and shortness of breath significantly reduced.', feel: "The lungs you have now are healthier than any you've had since you started smoking." },
  { day: 31, icon: '🚀', hour: 'Day 30+', text: 'You have done it. The parasite is dead. This is your new permanent baseline.', feel: 'Everything from here is compounding. Health, clarity, energy — all of it keeps improving.' },
];

// Selector that mirrors Threshold behaviour at ac4b193~1:index.html
// lines 3887-3893 — walk the hourly keys, find the largest one whose
// value is <= currentHour; fall back to Day-based selection past D7.
export function selectCurrentBodyMessage(cleanHrs: number): BodyMessage {
  const currentHour = Math.floor(cleanHrs);
  if (currentHour <= 168) {
    const keys = Object.keys(HOURLY_MSGS)
      .map(Number)
      .sort((a, b) => a - b);
    let chosen: BodyMessage | null = null;
    for (const k of keys) {
      if (k <= currentHour) chosen = HOURLY_MSGS[k] ?? chosen;
    }
    return chosen ?? HOURLY_MSGS[0]!;
  }
  const day = Math.floor(cleanHrs / 24);
  let daily: DailyMessage | null = null;
  for (const d of DAILY_MSGS) {
    if (day >= d.day) daily = d;
  }
  return daily ?? DAILY_MSGS[0]!;
}
