import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { Move } from './moves';
import { Camera, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { WORKOUT_FINISH_BTN, WORKOUT_TIMER_GLOW } from './workoutUi';

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
  const [buttonLabel] = useState(
    () =>
      t.moves.buttonLabels[
        Math.floor(Math.random() * t.moves.buttonLabels.length)
      ]
  );
  const seconds = externalSeconds ?? internalSeconds;

  useEffect(() => {
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
  }, [externalSeconds, setSeconds]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex flex-col w-full min-h-screen ${move.color} p-4 md:p-8 transition-colors duration-200`}>
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
            className={`workout-timer ${WORKOUT_TIMER_GLOW[move.lineupSlot]}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}>
            {formatTime(seconds)}
          </motion.div>

          <motion.button
            type="button"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4, delay: 0.3 }}
            disabled={finishing}
            onClick={() => onFinish(seconds)}
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
