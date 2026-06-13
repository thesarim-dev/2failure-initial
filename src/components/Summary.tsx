import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Move } from './moves';
import { ArrowRight, Skull } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { SetRepResult } from '../types/repProgress';
import { formatPersonalBestDate } from '../lib/repProgress';
import {
  SUMMARY_ACCENT_TEXT,
  SUMMARY_CONFETTI,
  SUMMARY_HOME_BTN,
  SUMMARY_SKULL,
  SUMMARY_TITLE
} from './workoutUi';

const MOTIVATION_QUOTES = [
  {
    text: 'I have not failed. I’ve just found 10,000 ways that won’t work.',
    author: 'Thomas Edison'
  },
  {
    text: 'Genius is one percent inspiration and ninety-nine percent perspiration.',
    author: 'Thomas Edison'
  },
  {
    text: 'Whether you think you can, or you think you can’t — you’re right.',
    author: 'Henry Ford'
  },
  {
    text: 'Nothing in life is to be feared, it is only to be understood.',
    author: 'Marie Curie'
  },
  {
    text: 'Strive not to be a success, but rather to be of value.',
    author: 'Albert Einstein'
  },
  {
    text: 'The way to get started is to quit talking and begin doing.',
    author: 'Walt Disney'
  },
  {
    text: 'It always seems impossible until it’s done.',
    author: 'Nelson Mandela'
  },
  {
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt'
  }
] as const;

interface SummaryProps {
  move: Move;
  duration: number;
  setResult: SetRepResult | null;
  onHome: () => void;
}

export function Summary({ move, duration, setResult, onHome }: SummaryProps) {
  const [quote] = useState(
    () => MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]
  );
  const slot = move.lineupSlot;

  useEffect(() => {
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
  }, [slot]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getSnarkyMessage = (seconds: number) => {
    if (seconds < 15) return 'That was pathetic. But at least you tried.';
    if (seconds < 45) return "Mid effort. We'll take it.";
    if (seconds < 90) return 'Okay, try-hard. Go take a shower.';
    return 'This is too easy for you. Move evolved next time.';
  };

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
          className={`${SUMMARY_TITLE[slot]} mb-2`}>
          FAILURE LOGGED
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-base text-center mb-8 opacity-70 font-semibold normal-case max-w-sm">
          {getSnarkyMessage(duration)}
        </motion.p>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full cyber-panel p-5 mb-8 normal-case">
          <div className="summary-receipt-divider">
            <h3 className="text-xl font-bold uppercase tracking-wide text-center">
              Official Receipt
            </h3>
            <p className="text-center text-sm font-medium mt-1 opacity-70">
              2failure — lose is improve
            </p>
          </div>

          <div className="space-y-3 font-semibold text-base">
            <div className="flex justify-between gap-3">
              <span className="opacity-70">item</span>
              <span className="uppercase text-right">{move.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="opacity-70">duration</span>
              <span>{formatTime(duration)}</span>
            </div>
            {setResult && (
              <>
                <div className="flex justify-between gap-3">
                  <span className="opacity-70">reps (this set)</span>
                  <span>{setResult.reps}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="opacity-70 shrink-0">personal best</span>
                  <span className="text-right">
                    {setResult.personalBest.reps ?? '—'}
                    {setResult.personalBest.reps !== null && (
                      <span className="block text-sm font-medium opacity-70 normal-case">
                        ({formatPersonalBestDate(setResult.personalBest.achievedAt)})
                      </span>
                    )}
                  </span>
                </div>
                {setResult.isNewPersonalBest && (
                  <p className={`summary-pb-badge ${SUMMARY_ACCENT_TEXT[slot]}`}>
                    new personal best!
                  </p>
                )}
              </>
            )}
            <div className="flex justify-between gap-3">
              <span className="opacity-70">status</span>
              <span className={`uppercase font-bold ${SUMMARY_ACCENT_TEXT[slot]}`}>
                cooked
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
          className={SUMMARY_HOME_BTN[slot]}>
          back to suffering
          <ArrowRight size={22} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
