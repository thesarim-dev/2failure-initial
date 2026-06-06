import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Move, BUTTON_LABELS } from './moves';
import { X } from 'lucide-react';

interface TimedWorkoutProps {
  move: Move;
  onFinish: (duration: number, trackedReps?: number) => void;
  onCancel: () => void;
}

export function TimedWorkout({ move, onFinish, onCancel }: TimedWorkoutProps) {
  const [seconds, setSeconds] = useState(0);
  const [buttonLabel] = useState(
    () => BUTTON_LABELS[Math.floor(Math.random() * BUTTON_LABELS.length)]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex flex-col w-full min-h-screen ${move.color} p-4 md:p-8 transition-colors duration-200`}>
      <header className="flex justify-between items-center mb-12">
        <button
          onClick={onCancel}
          className="bg-white dark:bg-[#1a1a1a] dark:text-white border-4 border-black dark:border-white p-2 brutal-shadow-sm brutal-shadow-hover transition-all">
          <X size={24} strokeWidth={3} />
        </button>
        <div className="bg-black text-white px-4 py-2 border-2 border-black dark:border-white font-bold uppercase tracking-widest text-sm">
          Failing in progress
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.h2
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl md:text-8xl mb-4">
          {move.name}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl font-bold mb-12 max-w-md">
          {move.description}
        </motion.p>

        <motion.div
          className="font-display text-8xl md:text-[120px] tracking-tighter mb-16"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}>
          {formatTime(seconds)}
        </motion.div>
      </div>

      <motion.button
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        onClick={() => onFinish(seconds)}
        className="w-full bg-black text-white border-4 border-black dark:border-white p-8 brutal-shadow brutal-shadow-hover transition-all duration-200 mb-8">
        <span className="font-display text-4xl md:text-5xl block transform -skew-x-6">
          {buttonLabel}
        </span>
      </motion.button>
    </div>
  );
}
