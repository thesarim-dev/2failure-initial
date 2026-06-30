import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowBigDown, ArrowBigUp, ArrowRight } from 'lucide-react';
import { Move } from './moves';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  fetchLastWeightedSetBeforeToday,
  fetchTodaysWeightedSets
} from '../lib/weightProgress';
import type { LastWeightedSet } from '../types/repProgress';
import type { RirPrescriptionKey } from '../lib/setPrescription';
import type { WeightUnit } from '../lib/weightUnits';
import {
  displayToKg,
  formatWeight,
  kgToDisplay,
  roundDisplayToPlate,
  weightInputStep
} from '../lib/weightUnits';
import { WORKOUT_FINISH_BTN } from './workoutUi';

interface WeightRepPromptProps {
  move: Move;
  setNumber: number;
  totalSets: number;
  rirKey: RirPrescriptionKey;
  weightUnit: WeightUnit;
  submitting?: boolean;
  saveError?: string | null;
  initialReps?: number;
  onSubmit: (weightKg: number, reps: number) => void;
}

function formatDisplayWeight(value: number, unit: WeightUnit): string {
  const rounded = roundDisplayToPlate(value, unit);
  return unit === 'lb'
    ? rounded % 1 === 0
      ? `${rounded}`
      : rounded.toFixed(1)
    : rounded % 1 === 0
      ? `${rounded}`
      : rounded.toFixed(1);
}

interface StepperRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseAria: string;
  increaseAria: string;
  inputAria: string;
  placeholder: string;
  inputMode: 'decimal' | 'numeric';
  autoFocus?: boolean;
}

function StepperRow({
  label,
  value,
  onChange,
  onDecrease,
  onIncrease,
  decreaseAria,
  increaseAria,
  inputAria,
  placeholder,
  inputMode,
  autoFocus = false
}: StepperRowProps) {
  return (
    <div className="workout-weight-field normal-case">
      <span className="workout-weight-label">{label}</span>
      <div className="workout-stepper">
        <button
          type="button"
          onClick={onDecrease}
          className="workout-stepper-btn workout-stepper-btn--down"
          aria-label={decreaseAria}>
          <ArrowBigDown size={52} strokeWidth={3} aria-hidden />
        </button>
        <input
          type="number"
          inputMode={inputMode}
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="workout-rep-input workout-stepper-input"
          aria-label={inputAria}
        />
        <button
          type="button"
          onClick={onIncrease}
          className="workout-stepper-btn workout-stepper-btn--up"
          aria-label={increaseAria}>
          <ArrowBigUp size={52} strokeWidth={3} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function WeightRepPrompt({
  move,
  setNumber,
  totalSets,
  rirKey,
  weightUnit,
  submitting = false,
  saveError = null,
  initialReps,
  onSubmit
}: WeightRepPromptProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const copy = t.workout.weightPrompt;
  const [weightValue, setWeightValue] = useState('');
  const [repsValue, setRepsValue] = useState(
    initialReps && initialReps > 0 ? String(initialReps) : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [lastSession, setLastSession] = useState<LastWeightedSet | null>(null);
  const [todaysSets, setTodaysSets] = useState<LastWeightedSet[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  const rirText = copy[rirKey];
  const weightLabel =
    weightUnit === 'lb' ? copy.weightLabelLb : copy.weightLabelKg;
  const weightAria =
    weightUnit === 'lb' ? copy.weightAriaLb : copy.weightAriaKg;
  const inputStep = weightInputStep(weightUnit);
  const inputMin = inputStep;

  useEffect(() => {
    if (!user) {
      setLoadingContext(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [previous, today] = await Promise.all([
          fetchLastWeightedSetBeforeToday(user.id, move.categoryId),
          fetchTodaysWeightedSets(user.id, move.categoryId)
        ]);
        if (cancelled) return;

        setLastSession(previous);
        setTodaysSets(today);

        const prefillKg =
          setNumber > 1 && today.length > 0
            ? today[0].weightKg
            : previous?.weightKg;

        if (prefillKg) {
          const display = kgToDisplay(prefillKg, weightUnit);
          setWeightValue(formatDisplayWeight(display, weightUnit));
        }
      } catch {
        if (!cancelled) {
          setLastSession(null);
          setTodaysSets([]);
        }
      } finally {
        if (!cancelled) setLoadingContext(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, move.categoryId, setNumber, weightUnit]);

  const todaysSummary = useMemo(() => {
    if (todaysSets.length === 0) return null;
    const parts = todaysSets.map(
      (set) => `${formatWeight(set.weightKg, weightUnit)} × ${set.reps}`
    );
    return copy.todaysSets(parts.join(' · '));
  }, [copy, todaysSets, weightUnit]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const display = parseFloat(weightValue);
    const reps = parseInt(repsValue, 10);

    if (!Number.isFinite(display) || display <= 0) {
      setError(copy.weightError);
      return;
    }
    if (!Number.isFinite(reps) || reps < 1) {
      setError(copy.repsError);
      return;
    }

    const displayRounded = roundDisplayToPlate(display, weightUnit);
    const weightKg = displayToKg(displayRounded, weightUnit);

    setError(null);
    onSubmit(weightKg, reps);
  };

  const bumpWeight = (direction: 1 | -1) => {
    const current = parseFloat(weightValue);
    const base =
      Number.isFinite(current) && current > 0 ? current : inputMin;
    const next = Math.max(
      inputMin,
      roundDisplayToPlate(base + direction * inputStep, weightUnit)
    );
    setWeightValue(formatDisplayWeight(next, weightUnit));
    if (error) setError(null);
  };

  const bumpReps = (direction: 1 | -1) => {
    const current = parseInt(repsValue, 10);
    const base = Number.isFinite(current) && current >= 1 ? current : 1;
    setRepsValue(String(Math.max(1, base + direction)));
    if (error) setError(null);
  };

  return (
    <div
      className={`flex flex-col w-full min-h-screen ${move.color} p-4 md:p-8 transition-colors duration-200`}>
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <motion.h2
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="workout-title mb-2 normal-case">
          {move.name}
        </motion.h2>

        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="workout-subtitle mb-1 normal-case font-bold">
          {copy.setLabel(setNumber, totalSets)}
        </motion.p>

        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="workout-weight-rir normal-case mb-4 opacity-90">
          {rirText}
        </motion.p>

        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="workout-subtitle mb-4 normal-case text-sm opacity-80">
          {copy.question}
        </motion.p>

        {!loadingContext && todaysSummary && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="workout-weight-last normal-case mb-3 text-sm">
            {todaysSummary}
          </motion.p>
        )}

        {!loadingContext && setNumber === 1 && lastSession && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="workout-weight-last normal-case mb-6">
            {copy.lastSession(
              formatWeight(lastSession.weightKg, weightUnit),
              lastSession.reps
            )}
          </motion.p>
        )}

        <motion.form
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          noValidate
          className="w-full space-y-4">
          <StepperRow
            label={weightLabel}
            value={weightValue}
            onChange={(next) => {
              setWeightValue(next);
              if (error) setError(null);
            }}
            onDecrease={() => bumpWeight(-1)}
            onIncrease={() => bumpWeight(1)}
            decreaseAria={copy.decreaseWeight}
            increaseAria={copy.increaseWeight}
            inputAria={weightAria}
            placeholder={copy.weightPlaceholder}
            inputMode="decimal"
            autoFocus
          />

          <StepperRow
            label={copy.repsLabel}
            value={repsValue}
            onChange={(next) => {
              setRepsValue(next);
              if (error) setError(null);
            }}
            onDecrease={() => bumpReps(-1)}
            onIncrease={() => bumpReps(1)}
            decreaseAria={copy.decreaseReps}
            increaseAria={copy.increaseReps}
            inputAria={copy.repsAria}
            placeholder={copy.repsPlaceholder}
            inputMode="numeric"
          />

          {error && <p className="workout-error normal-case">{error}</p>}
          {saveError && !error && (
            <p className="workout-error normal-case">{saveError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`${WORKOUT_FINISH_BTN} flex items-center justify-center gap-2 normal-case`}>
            <span>{submitting ? t.workout.saving : copy.submit}</span>
            <ArrowRight size={24} strokeWidth={2.5} />
          </button>
        </motion.form>
      </div>
    </div>
  );
}
