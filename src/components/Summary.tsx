import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Move } from './moves';
import { ArrowRight, Skull } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { SetRepResult } from '../types/repProgress';
import { formatPersonalBestDate } from '../lib/repProgress';
import { useLanguage } from '../context/LanguageContext';
import type { WeightUnit } from '../lib/weightUnits';
import { formatWeight } from '../lib/weightUnits';
import {
  SUMMARY_ACCENT_TEXT,
  SUMMARY_CONFETTI,
  SUMMARY_HOME_BTN,
  SUMMARY_SKULL,
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
  onHome
}: SummaryProps) {
  const { t, language } = useLanguage();
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
          <Skull size={72} strokeWidth={2.5} className={SUMMARY_SKULL[slot]} />
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
