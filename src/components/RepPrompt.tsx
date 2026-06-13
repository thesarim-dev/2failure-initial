import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Move } from './moves';
import { ArrowRight } from 'lucide-react';
import { WORKOUT_FINISH_BTN } from './workoutUi';

interface RepPromptProps {
  move: Move;
  onSubmit: (reps: number) => void;
}

export function RepPrompt({ move, onSubmit }: RepPromptProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reps = parseInt(value, 10);
    if (!Number.isFinite(reps) || reps < 1) {
      setError('Enter at least 1 rep.');
      return;
    }
    setError(null);
    onSubmit(reps);
  };

  return (
    <div
      className={`flex flex-col w-full min-h-screen ${move.color} p-4 md:p-8 transition-colors duration-200`}>
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <motion.h2
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="workout-title mb-3">
          {move.name}
        </motion.h2>

        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="workout-subtitle mb-10 normal-case">
          How many reps did you hit this set?
        </motion.p>

        <motion.form
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="w-full space-y-4">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="0"
            className="workout-rep-input"
            aria-label="Reps completed"
          />

          {error && <p className="workout-error normal-case">{error}</p>}

          <button
            type="submit"
            className={`${WORKOUT_FINISH_BTN} flex items-center justify-center gap-2`}>
            <span>log it</span>
            <ArrowRight size={24} strokeWidth={2.5} />
          </button>
        </motion.form>
      </div>
    </div>
  );
}
