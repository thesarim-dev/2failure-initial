import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
  onHome
}: SummaryProps) {
  const { t, language } = useLanguage();
  const questText = useQuestText();
  const [quote] = useState(
    () => t.summary.quotes[Math.floor(Math.random() * t.summary.quotes.length)]
  );
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

  return (
    <div className="flex flex-col w-full min-h-screen p-4 md:p-8 max-w-2xl mx-auto pb-24">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          className="mb-6">
          <FailureLogo size={72} className={SUMMARY_LOGO} />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${SUMMARY_TITLE[slot]} mb-2 normal-case`}>
          {headline}
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-base text-center mb-8 opacity-70 font-semibold normal-case max-w-sm">
          {snarkyMessage}
        </motion.p>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full cyber-panel p-5 mb-8 normal-case">
          <div className="summary-receipt-divider">
            <h3 className="text-xl font-bold uppercase tracking-wide text-center normal-case">
              {t.summary.receiptTitle}
            </h3>
            <p className="text-center text-sm font-medium mt-1 opacity-70">
              {t.summary.receiptTagline}
            </p>
          </div>

          <div className="space-y-3 font-semibold text-base">
            <div className="flex justify-between gap-3">
              <span className="opacity-70">{t.summary.item}</span>
              <span className="uppercase text-right normal-case">{move.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="opacity-70">{t.summary.duration}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="opacity-70">{t.summary.coinsEarned}</span>
              <span className={`tabular-nums ${SUMMARY_ACCENT_TEXT[slot]}`}>
                +{coinsEarned}
              </span>
            </div>
            {showCoinsCapRecommendation && (
              <p className={`summary-progression-hint ${SUMMARY_ACCENT_TEXT[slot]}`}>
                {t.summary.coinsCapRecommendation}
              </p>
            )}
            {setResult && (
              <>
                {setResult.weightKg && setResult.weightKg > 0 ? (
                  <div className="flex justify-between gap-3">
                    <span className="opacity-70">{t.summary.weightThisSet}</span>
                    <span>
                      {formatWeight(setResult.weightKg, weightUnit)} ×{' '}
                      {setResult.reps}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between gap-3">
                    <span className="opacity-70">{t.summary.repsThisSet}</span>
                    <span>{setResult.reps}</span>
                  </div>
                )}
                {setResult.weightKg && setResult.weightKg > 0 ? (
                  <div className="flex justify-between items-start gap-4">
                    <span className="opacity-70 shrink-0">
                      {t.summary.weightPersonalBest}
                    </span>
                    <span className="text-right">
                      {setResult.weightPersonalBest?.weightKg &&
                      setResult.weightPersonalBest.reps
                        ? `${formatWeight(setResult.weightPersonalBest.weightKg, weightUnit)} × ${setResult.weightPersonalBest.reps}`
                        : t.summary.emptyValue}
                      {setResult.weightPersonalBest?.weightKg && (
                        <span className="block text-sm font-medium opacity-70 normal-case">
                          (
                          {formatPersonalBestDate(
                            setResult.weightPersonalBest.achievedAt,
                            language
                          )}
                          )
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-start gap-4">
                    <span className="opacity-70 shrink-0">{t.summary.personalBest}</span>
                    <span className="text-right">
                      {setResult.personalBest.reps ?? t.summary.emptyValue}
                      {setResult.personalBest.reps !== null && (
                        <span className="block text-sm font-medium opacity-70 normal-case">
                          (
                          {formatPersonalBestDate(
                            setResult.personalBest.achievedAt,
                            language
                          )}
                          )
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {setResult.isNewPersonalBest && !setResult.weightKg && (
                  <p className={`summary-pb-badge ${SUMMARY_ACCENT_TEXT[slot]}`}>
                    {t.summary.newPersonalBest}
                  </p>
                )}
                {setResult.isNewWeightPersonalBest && (
                  <p className={`summary-pb-badge ${SUMMARY_ACCENT_TEXT[slot]}`}>
                    {t.summary.newWeightPersonalBest}
                  </p>
                )}
                {progressionMessage && (
                  <p className={`summary-progression-hint ${SUMMARY_ACCENT_TEXT[slot]}`}>
                    {progressionMessage}
                  </p>
                )}
              </>
            )}
            {levelUp && (
              <div className="summary-level-up normal-case" role="note">
                <p className={`summary-level-up-title ${SUMMARY_ACCENT_TEXT[slot]}`}>
                  <TrendingUp size={16} strokeWidth={2.75} aria-hidden="true" />
                  {t.summary.levelUp.title}
                </p>
                <p className="summary-level-up-body">{levelUp.why}</p>
                <p className="summary-level-up-next">{levelUp.next}</p>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="opacity-70">{t.summary.status}</span>
              <span className={`uppercase font-bold ${SUMMARY_ACCENT_TEXT[slot]} normal-case`}>
                {t.summary.statusCooked}
              </span>
            </div>
          </div>

          <div className="summary-receipt-footer text-center">
            <p className="text-sm font-medium leading-snug opacity-90">
              {quote.text}
            </p>
            <p className="text-xs font-semibold mt-1.5 opacity-70">
              — {quote.author}
            </p>
          </div>
        </motion.div>

        {baseReward && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="summary-base cyber-panel normal-case"
            aria-label={t.game.reward.title}>
            <p className="summary-base-title">
              <Castle size={16} strokeWidth={2.5} aria-hidden="true" />
              {t.game.reward.title}
            </p>
            {resourcesOf(baseReward).length > 0 && (
              <p className="summary-base-earned">
                {resourcesOf(baseReward).map(([id, amount]) => (
                  <span key={id} className="summary-base-chip">
                    <ResourceIcon id={id} size={16} />+{amount} {t.game.resources[id]}
                  </span>
                ))}
              </p>
            )}
            {baseReward.rate !== 'full' && (
              <p className="summary-base-note">
                {baseReward.rate === 'tooShort'
                  ? t.game.reward.tooShort
                  : baseReward.beyondPlan
                    ? t.game.rewardExtra.beyondPlan
                    : baseReward.rate === 'half'
                      ? t.game.reward.half
                      : t.game.reward.limit}
              </p>
            )}
            {baseReward.springBonus ? (
              <p className="summary-base-note">{t.game.rewardExtra.spring(baseReward.springBonus)}</p>
            ) : null}
            {baseReward.questsDone.map((quest) => (
              <p key={quest.id} className="summary-base-line summary-base-quest">
                {t.game.rewardExtra.quest(questText(quest))}
              </p>
            ))}
            {baseReward.session && (
              <p className="summary-base-line summary-base-quest">{t.game.rewardExtra.session}</p>
            )}
            {baseReward.weekly && (
              <p className="summary-base-line summary-base-trophy">{t.game.rewardExtra.weekly}</p>
            )}
            {baseReward.shieldEarned && (
              <p className="summary-base-line">{t.game.rewardExtra.shield}</p>
            )}
            {baseReward.constructions.map((job, index) => {
              const name = job.itemId.startsWith('trophy:')
                ? t.game.trophyNames[job.itemId.slice(7)]?.name ?? ''
                : t.game.items[job.itemId]?.name ?? '';
              return (
                <p key={`${job.itemId}-${index}`} className="summary-base-line">
                  {job.setsRemaining === 0
                    ? t.game.reward.built(name)
                    : t.game.reward.construction(name, job.setsRemaining)}
                </p>
              );
            })}
            {baseReward.newTrophies.map((id) => (
              <p key={id} className="summary-base-line summary-base-trophy">
                {t.game.reward.newTrophy(t.game.trophyNames[id]?.name ?? id)}
              </p>
            ))}
            {onSeeBase && (
              <button type="button" className="summary-base-btn" onClick={onSeeBase}>
                {t.game.reward.seeBase}
                <ArrowRight size={16} strokeWidth={2.5} className="tour-icon-flip" aria-hidden="true" />
              </button>
            )}
          </motion.section>
        )}

        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={onHome}
          className={`${SUMMARY_HOME_BTN[slot]} normal-case`}>
          {t.summary.backHome}
          <ArrowRight size={22} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
