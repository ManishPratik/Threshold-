import { useEffect, useState } from 'react';
import { Button, Card, Heading, ProgressBar, Text } from '@shared/ui';
import {
  PEAK_END_HOURS,
  crossedHurdles,
  getWormScale,
  getWormStage,
  HURDLES,
  nextHurdle,
  nicotinePctRemaining,
} from './science';
import {
  formatPeakRemaining,
  peakCrossedFraction,
  selectPeakPhase,
} from './peakPhase';
import {
  formatChamberPct,
  selectChamberState,
  WORM_STAGE_COPY,
} from './wormData';
import {
  DEFAULT_PACK_COST_RUPEES,
  ackHurdle,
  ackPeakCrossed,
  cleanHoursSince,
  clearQuitAt,
  fullRelapseReset,
  isPeakCrossedAcked,
  readAckedHurdles,
  readPackCost,
  readQuitAt,
  setQuitAt,
} from './state';
import { fetchSurfedCount } from './state';
import { EditableSlot } from './EditableSlot';
import {
  HurdleCrossOverlay,
  PeakCrossedOverlay,
  SlipOverlay,
} from './Celebrations';
import type { Hurdle } from './science';
import {
  bodyAwarenessCopy,
  moneySavedRupees,
  naturalHighPercent,
  selectMoneyAnchor,
} from './moneyAnchor';
import {
  nextHealthMilestone,
  reachedHealthMilestones,
} from './healthMilestones';
import { selectCurrentBodyMessage } from './hourlyMessages';
import styles from './SmokingScienceWidget.module.css';

// Composite widget that renders every Threshold-parity science
// surface (chamber percent + worm stage, peak-withdrawal banner or
// peak-crossed badge, hurdles chain) driven off the stored quit-time
// timestamp. First-visit CTA offers to mark "now" as the quit moment
// when no quit time is stored, matching the Threshold flow at
// ac4b193~1:index.html line 5175 which stamps `LS.QUIT_TIME = now` on
// the "already quit" branch.
export function SmokingScienceWidget() {
  const [quitAt, setQuitAtState] = useState<number | null>(null);
  const [packCost, setPackCostState] = useState<number>(
    DEFAULT_PACK_COST_RUPEES,
  );
  const [surfed, setSurfed] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [peakAcked, setPeakAcked] = useState<boolean>(true);
  const [ackedHurdleIds, setAckedHurdleIds] = useState<readonly string[]>([]);
  const [slipOpen, setSlipOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedQuit, storedCost, storedSurfed, peakDone, hurdlesAcked] =
        await Promise.all([
          readQuitAt(),
          readPackCost(),
          fetchSurfedCount(),
          isPeakCrossedAcked(),
          readAckedHurdles(),
        ]);
      if (cancelled) return;
      setQuitAtState(storedQuit);
      setPackCostState(storedCost);
      setSurfed(storedSurfed);
      setPeakAcked(peakDone);
      setAckedHurdleIds(hurdlesAcked);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (quitAt === null) return;
    const tick = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(tick);
    };
  }, [quitAt]);

  const handleStamp = async () => {
    setSaving(true);
    const stamped = Date.now();
    await setQuitAt(stamped);
    setQuitAtState(stamped);
    setNow(stamped);
    setSaving(false);
  };

  if (!loaded) {
    return null;
  }

  if (quitAt === null) {
    return (
      <Card padding="lg" className={styles.firstRunCard}>
        <Heading level={2} className={styles.firstRunTitle}>
          When did you last smoke?
        </Heading>
        <Text variant="secondary" className={styles.firstRunSub}>
          Tap to stamp this moment as your quit time. Every clean-hours
          calculation on Today derives from it.
        </Text>
        <Button
          variant="primary"
          size="lg"
          type="button"
          onClick={() => {
            void handleStamp();
          }}
          disabled={saving}
        >
          Right now — I&rsquo;m done.
        </Button>
      </Card>
    );
  }

  const cleanHrs = cleanHoursSince(quitAt, now);
  const pct = nicotinePctRemaining(cleanHrs);
  const stage = getWormStage(cleanHrs);
  const wormCopy = WORM_STAGE_COPY[stage];
  const chamberState = selectChamberState(pct);
  const chamberDisplay = formatChamberPct(pct);
  const scale = getWormScale(cleanHrs);

  const peakPhase = selectPeakPhase(cleanHrs);
  const peakCrossed = cleanHrs >= PEAK_END_HOURS;
  const peakFraction = peakCrossedFraction(cleanHrs);
  const peakRemainingLabel = formatPeakRemaining(cleanHrs);

  const crossed = crossedHurdles(cleanHrs);
  const upcoming = nextHurdle(cleanHrs);

  const shouldCelebratePeak =
    !peakAcked && cleanHrs >= PEAK_END_HOURS;
  const pendingHurdleCelebration: Hurdle | null =
    crossed.find((h) => !ackedHurdleIds.includes(h.id)) ?? null;

  const handlePeakAck = async () => {
    await ackPeakCrossed();
    setPeakAcked(true);
  };
  const handleHurdleAck = async (id: string) => {
    const next = await ackHurdle(id);
    setAckedHurdleIds(next);
  };
  const handleLogSlip = async () => {
    // A slip preserves the streak — no state change beyond closing the modal.
    // Threshold source at ac4b193~1:index.html line 3510 writes a lapse row
    // into the craving log; Personal OS keeps the craving log independent
    // and the slip modal is now purely a coaching moment.
    setSlipOpen(false);
  };
  const handleFullRelapse = async () => {
    await fullRelapseReset();
    await clearQuitAt();
    setQuitAtState(null);
    setSlipOpen(false);
    setPeakAcked(false);
    setAckedHurdleIds([]);
  };

  const nhPct = naturalHighPercent(cleanHrs);
  const money = moneySavedRupees(cleanHrs, packCost);
  const moneyAnchor = selectMoneyAnchor(money);
  const bodyCopy = bodyAwarenessCopy(cleanHrs);
  const currentMsg = selectCurrentBodyMessage(cleanHrs);
  const reachedMilestones = reachedHealthMilestones(cleanHrs);
  const upcomingMilestone = nextHealthMilestone(cleanHrs);

  return (
    <div className={styles.stack}>
      {shouldCelebratePeak ? (
        <PeakCrossedOverlay
          onAcknowledge={() => {
            void handlePeakAck();
          }}
        />
      ) : null}
      {!shouldCelebratePeak && pendingHurdleCelebration !== null ? (
        <HurdleCrossOverlay
          hurdle={pendingHurdleCelebration}
          onAcknowledge={() => {
            void handleHurdleAck(pendingHurdleCelebration.id);
          }}
        />
      ) : null}
      {slipOpen ? (
        <SlipOverlay
          onLogSlip={() => {
            void handleLogSlip();
          }}
          onFullRelapse={() => {
            void handleFullRelapse();
          }}
          onCancel={() => setSlipOpen(false)}
        />
      ) : null}

      <Card padding="md" className={styles.quoteCard}>
        <p className={styles.quoteEyebrow}>Today</p>
        <div className={styles.quoteText}>
          &ldquo;<EditableSlot slotKey="FR_QUOTE" as="span" />&rdquo;
        </div>
      </Card>

      <Card padding="md" className={styles.vitalsCard}>
        <div className={styles.vitalsRow}>
          <div className={styles.vitalsCell}>
            <p className={styles.vitalsLabel}>Surfed</p>
            <p className={styles.vitalsValue}>{surfed}</p>
            <p className={styles.vitalsSub}>cravings</p>
          </div>
          <div className={styles.vitalsCell}>
            <p className={styles.vitalsLabel}>Natural High</p>
            <p className={styles.vitalsValue}>{Math.round(nhPct)}%</p>
            <ProgressBar
              value={nhPct / 100}
              label={`${Math.round(nhPct)} percent of natural-high baseline`}
            />
          </div>
          <div className={styles.vitalsCell}>
            <p className={styles.vitalsLabel}>Saved</p>
            <p className={styles.vitalsValue}>
              ₹{money.toLocaleString('en-IN')}
            </p>
            <p className={styles.vitalsSub}>{moneyAnchor}</p>
          </div>
        </div>
      </Card>

      <Card padding="md" className={styles.currentMsgCard}>
        <p className={styles.currentMsgEyebrow}>
          {currentMsg.icon} {currentMsg.hour}
        </p>
        <p className={styles.currentMsgTitle}>{currentMsg.text}</p>
        <Text variant="secondary" className={styles.currentMsgFeel}>
          {currentMsg.feel}
        </Text>
        <p className={styles.currentMsgBody}>{bodyCopy}</p>
      </Card>

      {peakPhase !== null ? (
        <Card padding="md" className={styles.peakBanner}>
          <p className={styles.peakEyebrow}>{peakPhase.title}</p>
          <Text variant="secondary" className={styles.peakSub}>
            {peakPhase.subtitle}
          </Text>
          <div className={styles.peakCountdownRow}>
            <span className={styles.peakCountdownLabel}>Ends in</span>
            <span className={styles.peakCountdownValue}>
              {peakRemainingLabel}
            </span>
          </div>
          <ProgressBar
            value={peakFraction}
            label={`${Math.round(peakFraction * 100)} percent of peak crossed`}
          />
        </Card>
      ) : null}

      {peakCrossed ? (
        <Card padding="md" className={styles.crossedBadge}>
          <Heading level={3} className={styles.crossedTitle}>
            Peak Crossed
          </Heading>
          <Text variant="secondary">
            You already did the hardest thing.
          </Text>
        </Card>
      ) : null}

      <Card padding="lg" className={styles.chamberCard}>
        <p className={styles.chamberEyebrow}>% Nicotine in Blood</p>
        <p
          className={`${styles.chamberPct} ${
            styles[`chamberState_${chamberState}`]
          }`}
        >
          {chamberDisplay}
        </p>
        <p className={styles.wormLabel}>{wormCopy?.label}</p>
        <div
          aria-hidden="true"
          className={`${styles.wormWorm} ${styles[`wormState_${stage}`]}`}
          style={{ transform: `scale(${Math.max(0.05, scale)})` }}
        />
        <p className={styles.wsTitle}>{wormCopy?.title}</p>
        <Text variant="secondary" className={styles.wsFact}>
          {wormCopy?.fact}
        </Text>
      </Card>

      {crossed.length > 0 || upcoming !== null ? (
        <Card padding="md" className={styles.hurdlesCard}>
          <p className={styles.hurdlesTitle}>Hurdles Cleared</p>
          <Text variant="secondary" className={styles.hurdlesSub}>
            Each one is smaller than the peak you already crossed.
          </Text>
          <ol className={styles.hurdlesTrack}>
            {HURDLES.map((h) => {
              const isCrossed = crossed.some((c) => c.id === h.id);
              const isNext = upcoming?.id === h.id;
              return (
                <li
                  key={h.id}
                  className={`${styles.hurdle} ${
                    isCrossed ? styles.hurdleCrossed : ''
                  } ${isNext ? styles.hurdleNext : ''}`}
                >
                  <span className={styles.hurdleIcon} aria-hidden="true">
                    {h.icon}
                  </span>
                  <span className={styles.hurdleLabel}>{h.label}</span>
                  <span className={styles.hurdleTag}>
                    {isCrossed ? 'Cleared' : isNext ? 'Next' : 'Ahead'}
                  </span>
                </li>
              );
            })}
          </ol>
          {upcoming !== null ? (
            <div className={styles.nextHurdleBlock}>
              <p className={styles.nextHurdleHeadline}>{upcoming.headline}</p>
              <Text variant="secondary" className={styles.nextHurdleBody}>
                {upcoming.body}
              </Text>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card padding="md" className={styles.pledgeCard}>
        <div className={styles.pledgeIcon} aria-hidden="true">🚭</div>
        <p className={styles.pledgeTitle}>You are a non-smoker.</p>
        <div className={styles.pledgeBody}>
          <EditableSlot slotKey="PLEDGE_BODY" />
          <p className={styles.pledgeAnchor}>
            My quit date is{' '}
            <strong>
              {quitAt !== null
                ? new Date(quitAt).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </strong>
            .
          </p>
        </div>
      </Card>

      <Card padding="md" className={styles.lapseCard}>
        <p className={styles.lapseTitle}>If today doesn&rsquo;t go clean</p>
        <div className={styles.lapseBody}>
          <EditableSlot slotKey="LAPSE_BODY" />
        </div>
        <Button
          variant="secondary"
          size="md"
          type="button"
          onClick={() => setSlipOpen(true)}
        >
          Log a slip (streak intact)
        </Button>
      </Card>

      <details className={styles.dopamineCard}>
        <summary className={styles.dopamineSummary}>
          The Dopamine Trap — Science
        </summary>
        <div className={styles.dopamineBody}>
          <div className={styles.dopamineSection}>
            <EditableSlot slotKey="DOPAMINE_BODY" />
          </div>
          <div className={styles.dopamineSection}>
            <EditableSlot slotKey="DOPAMINE_TRUTH" />
          </div>
        </div>
      </details>

      <Card padding="md" className={styles.mantraCard}>
        <p className={styles.mantraEyebrow}>Your Mantra</p>
        <div className={styles.mantraText}>
          <EditableSlot slotKey="MANTRA" />
        </div>
      </Card>

      <Card padding="md" className={styles.healthCard}>
        <p className={styles.healthTitle}>Health Milestones</p>
        <Text variant="secondary" className={styles.healthSub}>
          Ten checkpoints from the first 20 minutes through the first month.
        </Text>
        <ol className={styles.healthList}>
          {reachedMilestones.map((m) => (
            <li key={m.mins} className={`${styles.healthItem} ${styles.healthReached}`}>
              <span aria-hidden="true" className={styles.healthEmoji}>{m.emoji}</span>
              <div className={styles.healthText}>
                <p className={styles.healthItemTitle}>{m.title}</p>
                <p className={styles.healthItemDesc}>{m.desc}</p>
              </div>
              <span className={styles.healthTag}>Reached</span>
            </li>
          ))}
          {upcomingMilestone !== null ? (
            <li key={upcomingMilestone.mins} className={`${styles.healthItem} ${styles.healthNext}`}>
              <span aria-hidden="true" className={styles.healthEmoji}>{upcomingMilestone.emoji}</span>
              <div className={styles.healthText}>
                <p className={styles.healthItemTitle}>{upcomingMilestone.title}</p>
                <p className={styles.healthItemDesc}>{upcomingMilestone.desc}</p>
              </div>
              <span className={styles.healthTag}>Next</span>
            </li>
          ) : null}
        </ol>
      </Card>
    </div>
  );
}
