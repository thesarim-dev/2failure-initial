import { FirstBaseMoment } from './game/FirstBaseMoment';
import { SaveProgress } from './SaveProgress';
import type { GameState, TodayPlan } from '../game/engine';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { fx } from '../lib/feedback';

/** Counts a number up from 0 for a satisfying reveal (instant with reduced motion). */
function useCountUp(target: number, durationMs: number, delayMs: number, skip: boolean): number {
  const [value, setValue] = useState(skip ? target : 0);
  useEffect(() => {
    if (skip) {
      setValue(target);
      return;
    }
    let frame = 0;
    const startAt = performance.now() + delayMs;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - startAt) / durationMs));
      // Ease out so it slows into the final number.
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, delayMs, skip]);
  return value;
}

const POP = { type: 'spring', stiffness: 420, damping: 22 } as const;
import { Move, getLevelUpAdvice, getVariantById } from './moves';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { localizeVariant } from '../i18n/localize';
import { Castle } from 'lucide-react';
import type { SetReward } from '../game/engine';
import { resourcesOf } from '../game/engine';
import { ResourceIcon, useQuestText } from './game/BaseScreen';
import { FailureLogo } from './FailureLogo';
import confetti from 'canvas-confetti';
import type { SetRepResult } from '../types/repProgress';
import { formatPersonalBestDate } from '../lib/repProgress';
import { useLanguage } from '../context/LanguageContext';
import type { WeightUnit } from '../lib/weightUnits';
import { formatWeight } from '../lib/weightUnits';
import {
  calculateCoinsEarned,
  isCoinEarningCapped
} from '../lib/coinRewards';
import {
  SUMMARY_ACCENT_TEXT,
  SUMMARY_CONFETTI,
  SUMMARY_HOME_BTN,
  SUMMARY_LOGO,
  SUMMARY_TITLE
} from './workoutUi';

interface SummaryProps {
  move: Move;
  duration: number;
  setResult: SetRepResult | null;
  weightUnit: WeightUnit;
  setNumber?: number;
  totalSets?: number;
  setsRemaining?: number;
  /** What this set earned for the base game. */
  baseReward?: SetReward | null;
  onSeeBase?: () => void;
  onHome: () => void;
  /** For the first-receipt moment: the player's base, shown with materials landing in it. */
  baseState?: GameState;
  basePlan?: TodayPlan | null;
  firstBase?: boolean;
}

export function Summary({
  move,
  duration,
  setResult,
  weightUnit,
  setNumber,
  totalSets,
  setsRemaining = 0,
  baseReward,
  onSeeBase,
  onHome,
  baseState,
  basePlan = null,
  firstBase = false
}: SummaryProps) {
  const { t, language } = useLanguage();
  const questText = useQuestText();
  const slot = move.lineupSlot;
  const isMidExercise = setsRemaining > 0;

  useEffect(() => {
    if (isMidExercise) return;

    const colors = SUMMARY_CONFETTI[slot];
    const end = Date.now() + 750;

    const shower = () => {
      confetti({
        particleCount: 2,
        angle: 270,
        spread: 70,
        startVelocity: 38,
        gravity: 1.8,
        ticks: 35,
        scalar: 0.65,
        origin: {
          x: Math.random() * 0.85 + 0.075,
          y: 0
        },
        colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(shower);
      }
    };

    shower();
  }, [slot, isMidExercise]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const snarkyMessage = useMemo(() => {
    if (duration < 15) return t.summary.snarky.pathetic;
    if (duration < 45) return t.summary.snarky.mid;
    if (duration < 90) return t.summary.snarky.tryHard;
    return t.summary.snarky.tooEasy;
  }, [duration, t.summary.snarky]);

  const coinsEarned = useMemo(
    () => calculateCoinsEarned(duration, move.tier ?? 'BASE'),
    [duration, move.tier]
  );
  // Past the top of a move's useful range (e.g. 50 pushups), point to a harder version.
  const levelUp = useMemo(() => {
    const advice = getLevelUpAdvice(move.id, setResult?.reps, duration);
    if (!advice) return null;
    const names = advice.nextIds
      .map((id) => getVariantById(id))
      .filter((variant): variant is NonNullable<typeof variant> => variant !== undefined)
      .map((variant) => localizeVariant(variant, t.moves).name)
      .join(', ');
    const copy = t.summary.levelUp;
    return {
      names,
      why:
        advice.kind === 'reps'
          ? copy.reps(setResult?.reps ?? 0)
          : copy.hold(duration),
      next: names
        ? copy.tryNext(names)
        : advice.kind === 'reps'
          ? copy.topOfLadderReps
          : copy.topOfLadderHold
    };
  }, [move.id, setResult?.reps, duration, t.moves, t.summary.levelUp]);
  // The level-up card already says "make it harder", so skip the coin-cap note then.
  const showCoinsCapRecommendation = useMemo(
    () => isCoinEarningCapped(duration) && !levelUp,
    [duration, levelUp]
  );

  const progressionMessage = useMemo(() => {
    if (!setResult?.progression?.suggestedWeightKg) return null;
    const weightLabel = formatWeight(
      setResult.progression.suggestedWeightKg,
      weightUnit
    );
    const { kind } = setResult.progression;
    return t.summary.progression[kind](weightLabel);
  }, [setResult, t.summary.progression, weightUnit]);

  const headline =
    isMidExercise && setNumber && totalSets
      ? t.summary.setLogged(setNumber, totalSets)
      : t.summary.title;

  const isWeighted = !!(setResult?.weightKg && setResult.weightKg > 0);
  const repsValue = setResult
    ? isWeighted
      ? `${formatWeight(setResult.weightKg ?? 0, weightUnit)} × ${setResult.reps}`
      : String(setResult.reps)
    : null;
  const isNewRecord = isWeighted ? setResult?.isNewWeightPersonalBest : setResult?.isNewPersonalBest;
  // Personal record: the value on one line, the date on the line below.
  const record = (() => {
    if (!setResult || isNewRecord) return null;
    if (isWeighted) {
      const best = setResult.weightPersonalBest;
      if (!best?.weightKg || !best.reps) return null;
      return {
        text: t.summary.compact.record(`${formatWeight(best.weightKg, weightUnit)} × ${best.reps}`),
        date: formatPersonalBestDate(best.achievedAt, language)
      };
    }
    if (setResult.personalBest.reps === null) return null;
    return {
      text: t.summary.compact.record(String(setResult.personalBest.reps)),
      date: formatPersonalBestDate(setResult.personalBest.achievedAt, language)
    };
  })();

  // One-line notes, only when they apply.
  const notes = [
    levelUp && (levelUp.names ? `${t.summary.compact.levelUp}: ${levelUp.names}` : levelUp.next),
    progressionMessage,
    showCoinsCapRecommendation && t.summary.coinsCapRecommendation
  ].filter((note): note is string => Boolean(note));

  const reduceMotion = useReducedMotion() ?? false;
  const coinsShown = useCountUp(coinsEarned, 650, 250, reduceMotion);
  const repsTarget = setResult && !isWeighted ? setResult.reps : 0;
  const repsShown = useCountUp(repsTarget, 750, 350, reduceMotion);

  // The win sound: a chime, then a sparkle for records, trophies and bonuses.
  useEffect(() => {
    const timers: number[] = [];
    if (isMidExercise) fx.coin();
    else fx.success();
    if (isNewRecord) timers.push(window.setTimeout(() => fx.record(), 500));
    if (baseReward && (baseReward.newTrophies.length || baseReward.weekly || baseReward.session || baseReward.questsDone.length)) {
      timers.push(window.setTimeout(() => fx.record(), isNewRecord ? 1000 : 600));
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
    // Once, when the receipt appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseChips: Array<{ key: string; text: string; tone?: 'quest' | 'trophy' }> = [];
  if (baseReward) {
    baseReward.questsDone.forEach((quest) =>
      baseChips.push({ key: quest.id, text: t.game.rewardExtra.quest(questText(quest)), tone: 'quest' })
    );
    if (baseReward.session) baseChips.push({ key: 'session', text: t.game.rewardExtra.session, tone: 'quest' });
    if (baseReward.weekly) baseChips.push({ key: 'weekly', text: t.game.rewardExtra.weekly, tone: 'trophy' });
    if (baseReward.shieldEarned) baseChips.push({ key: 'shield', text: t.game.rewardExtra.shield });
    baseReward.constructions.forEach((job, index) => {
      const name = job.itemId.startsWith('trophy:')
        ? t.game.trophyNames[job.itemId.slice(7)]?.name ?? ''
        : t.game.items[job.itemId]?.name ?? '';
      baseChips.push({
        key: `job-${index}`,
        text: job.setsRemaining === 0 ? t.game.reward.built(name) : t.game.reward.construction(name, job.setsRemaining)
      });
    });
    baseReward.newTrophies.forEach((id) =>
      baseChips.push({ key: `t-${id}`, text: t.game.reward.newTrophy(t.game.trophyNames[id]?.name ?? id), tone: 'trophy' })
    );
  }
  const baseNote =
    baseReward && baseReward.rate !== 'full'
      ? baseReward.rate === 'tooShort'
        ? t.game.reward.tooShort
        : baseReward.beyondPlan
          ? t.game.rewardExtra.beyondPlan
          : baseReward.rate === 'half'
            ? t.game.reward.half
            : t.game.reward.limit
      : null;

  return (
    <div className="summary-compact flex flex-col w-full min-h-screen max-w-md mx-auto">
      <motion.header
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="summary-compact-head normal-case">
        <motion.span
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15 }}>
          <FailureLogo size={40} className={SUMMARY_LOGO} />
        </motion.span>
        <div className="min-w-0">
          <h1 className={`${SUMMARY_TITLE[slot]} summary-compact-title normal-case`}>{headline}</h1>
          <p className="summary-compact-sub">{snarkyMessage}</p>
        </div>
      </motion.header>

      <motion.section
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="summary-card cyber-panel normal-case">
        <p className="summary-exercise">{move.name}</p>

        <div className="summary-tiles">
          <motion.div
            className="summary-tile"
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...POP, delay: 0.2 }}>
            <span className="summary-tile-label">{t.summary.compact.coins}</span>
            <span className={`summary-tile-value tabular-nums ${SUMMARY_ACCENT_TEXT[slot]}`}>+{coinsShown}</span>
            <span className="summary-tile-sub tabular-nums">{formatTime(duration)}</span>
          </motion.div>
          <motion.div
            className={`summary-tile ${isNewRecord ? 'is-record' : ''}`}
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...POP, delay: 0.3 }}>
            <span className="summary-tile-label">
              {repsValue ? (isWeighted ? t.summary.compact.load : t.summary.compact.reps) : t.summary.compact.hold}
            </span>
            <span className="summary-tile-value tabular-nums">
              {repsValue ? (isWeighted ? repsValue : repsShown) : formatTime(duration)}
            </span>
            {isNewRecord ? (
              <span className={`summary-tile-sub summary-tile-record summary-record-shine ${SUMMARY_ACCENT_TEXT[slot]}`}>
                {t.summary.compact.newRecord}
              </span>
            ) : (
              record && (
                <span className="summary-tile-sub">
                  {record.text}
                  <span className="summary-tile-date">{record.date}</span>
                </span>
              )
            )}
          </motion.div>
        </div>

        {notes.length > 0 && (
          <ul className="summary-notes">
            {notes.map((note) => (
              <li key={note} className={SUMMARY_ACCENT_TEXT[slot]}>
                <TrendingUp size={14} strokeWidth={2.75} aria-hidden="true" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}

        {firstBase && baseReward && baseState && onSeeBase && resourcesOf(baseReward).length > 0 && (
          <FirstBaseMoment state={baseState} plan={basePlan} earned={resourcesOf(baseReward)} onOpenBase={onSeeBase} />
        )}

        {baseReward && (
          <div className="summary-base-row" aria-label={t.game.reward.title}>
            <div className="summary-base-head">
              <span className="summary-base-title">
                <Castle size={15} strokeWidth={2.5} aria-hidden="true" />
                {t.game.reward.title}
              </span>
              {onSeeBase && !firstBase && (
                <button type="button" className="summary-base-link" onClick={onSeeBase}>
                  {t.game.reward.seeBase}
                  <ArrowRight size={14} strokeWidth={2.5} className="tour-icon-flip" aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="summary-base-chips">
              {resourcesOf(baseReward).map(([id, amount], i) => (
                <motion.span
                  key={id}
                  className="summary-base-chip"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...POP, delay: 0.5 + i * 0.07 }}>
                  <ResourceIcon id={id} size={16} />+{amount}
                  <span className="sr-only"> {t.game.resources[id]}</span>
                </motion.span>
              ))}
              {baseReward.springBonus ? (
                <span className="summary-base-chip">{t.game.rewardExtra.spring(baseReward.springBonus)}</span>
              ) : null}
              {baseChips.map((chip, i) => (
                <motion.span
                  key={chip.key}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...POP, delay: 0.62 + i * 0.08 }}
                  className={`summary-base-pill ${chip.tone === 'quest' ? 'is-quest' : chip.tone === 'trophy' ? 'is-trophy' : ''}`}>
                  {chip.text}
                </motion.span>
              ))}
            </div>
            {baseNote && <p className="summary-base-note">{baseNote}</p>}
          </div>
        )}
      </motion.section>

      {/* Guests: save the progress they just made. */}
      <SaveProgress where="receipt" />

      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={onHome}
        className={`${SUMMARY_HOME_BTN[slot]} summary-compact-home normal-case`}>
        {t.summary.backHome}
        <ArrowRight size={22} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
