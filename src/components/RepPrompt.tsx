import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Move } from './moves';
import { ArrowRight } from 'lucide-react';

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
          className="text-4xl md:text-5xl mb-4 text-center">
          {move.name}
        </motion.h2>

        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl font-bold mb-10 text-center max-w-sm">
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
            className="w-full bg-white text-black border-4 border-black p-6 text-center font-display text-5xl md:text-6xl brutal-shadow-sm focus:outline-none focus:ring-4 focus:ring-black/20"
          />

          {error && (
            <p className="text-center font-bold text-sm bg-black text-white px-3 py-2 border-2 border-black">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white border-4 border-black p-6 brutal-shadow brutal-shadow-hover transition-all duration-200 flex items-center justify-center gap-2">
            <span className="font-display text-2xl md:text-3xl">LOG IT</span>
            <ArrowRight size={28} strokeWidth={3} />
          </button>
        </motion.form>
      </div>
    </div>
  );
}
