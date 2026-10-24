import { isRepLoggedCategory } from './moves';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { Move } from './moves';
import { Camera, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { WORKOUT_FINISH_BTN, WORKOUT_TIMER_GLOW } from './workoutUi';
import { EffortRing } from './EffortRing';
import { fx } from '../lib/feedback';
import { prefersReducedMotion } from '../lib/motion';

interface TimedWorkoutProps {
  move: Move;
  finishing?: boolean;
  onFinish: (duration: number, trackedReps?: number) => void;
  onCancel: () => void;
  seconds?: number;
  setSeconds?: Dispatch<SetStateAction<number>>;
  onEnableAiTracking?: () => void;
}

export function TimedWorkout({
  move,
  finishing = false,
  onFinish,
  onCancel,
  seconds: externalSeconds,
  setSeconds,
  onEnableAiTracking
}: TimedWorkoutProps) {
  const { t } = useLanguage();
  const [internalSeconds, setInternalSeconds] = useState(0);
  // One clear label: the moment to tap is your last rep (or the end of a hold).
  const buttonLabel = isRepLoggedCategory(move.categoryId) ? t.moves.finishReps : t.moves.finishHold;
  const seconds = externalSeconds ?? internalSeconds;
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (ended) return; // the clock stops the moment the set ends
    if (externalSeconds === undefined) {
      const interval = setInterval(() => {
        setInternalSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    }

    if (!setSeconds) return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [externalSeconds, setSeconds, ended]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`workout-hero flex flex-col w-full min-h-screen ${move.color} p-4 md:p-8 transition-colors duration-200 ${ended ? 'is-ended' : ''}`}>
      <span className="workout-hero-bg" aria-hidden="true" />
      <header className="flex justify-between items-center mb-10 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="cyber-icon-btn cyber-icon-btn--back"
          aria-label={t.workout.cancel}>
          <X size={22} strokeWidth={2.5} />
        </button>
        <span className="workout-status-chip normal-case">
          {t.workout.failingInProgress}
        </span>
        <div className="w-10" aria-hidden="true" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
        <motion.h2
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="workout-title mb-3 normal-case">
          {move.name}
        </motion.h2>

        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="workout-subtitle mb-8 normal-case">
          {move.description}
        </motion.p>

        <div className="workout-timer-stack">
          <motion.div
            className={`workout-timer-hero ${WORKOUT_TIMER_GLOW[move.lineupSlot]}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.35 }}
            aria-label={formatTime(seconds)}>
            <EffortRing seconds={seconds} tier={move.tier ?? 'BASE'} done={ended} />
          </motion.div>

          <motion.button
            type="button"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4, delay: 0.3 }}
            disabled={finishing || ended}
            onClick={() => {
              // A satisfying finish: the ring snaps full with a flash and a chime,
              // then the set moves on.
              if (ended) return;
              setEnded(true);
              fx.success();
              const final = seconds;
              window.setTimeout(() => onFinish(final), prefersReducedMotion() ? 0 : 420);
            }}
            className={`${WORKOUT_FINISH_BTN} normal-case`}>
            {finishing ? t.workout.saving : buttonLabel}
          </motion.button>

          {onEnableAiTracking && (
            <button
              type="button"
              onClick={onEnableAiTracking}
              className="workout-secondary-btn normal-case">
              <Camera size={16} strokeWidth={2.5} />
              {t.workout.useAiTracking}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
