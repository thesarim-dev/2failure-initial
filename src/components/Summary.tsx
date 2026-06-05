import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Move } from './moves';
import { ArrowRight, Skull } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { SetRepResult } from '../types/repProgress';
import { formatPersonalBestDate } from '../lib/repProgress';

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

  useEffect(() => {
    const colors = ['#CCFF00', '#FF00FF', '#000000'];
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
  }, []);
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
    <div className="flex flex-col w-full min-h-screen bg-black text-white p-4 md:p-8">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <motion.div
          initial={{
            scale: 0,
            rotate: -180
          }}
          animate={{
            scale: 1,
            rotate: 0
          }}
          transition={{
            type: 'spring',
            damping: 15
          }}
          className="mb-8">
          
          <Skull size={80} className="text-[#CCFF00]" />
        </motion.div>

        <motion.h1
          initial={{
            y: 20,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{
            delay: 0.2
          }}
          className="text-5xl text-center mb-2 text-[#CCFF00]">
          
          FAILURE LOGGED
        </motion.h1>

        <motion.p
          initial={{
            y: 20,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{
            delay: 0.3
          }}
          className="text-xl text-center mb-12 text-white/70 font-bold">
          
          {getSnarkyMessage(duration)}
        </motion.p>

        {/* The Receipt */}
        <motion.div
          initial={{
            y: 50,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{
            delay: 0.5
          }}
          className="w-full bg-white text-black border-4 border-white p-6 brutal-shadow-sm mb-12 transform -rotate-2">
          
          <div className="border-b-4 border-black pb-4 mb-4 border-dashed">
            <h3 className="font-display text-2xl uppercase tracking-widest text-center">
              Official Receipt
            </h3>
            <p className="text-center text-sm font-normal mt-1 normal-case">
              2failure — lose is improve
            </p>
          </div>

          <div className="space-y-4 font-bold text-lg">
            <div className="flex justify-between">
              <span>ITEM:</span>
              <span className="uppercase">{move.name}</span>
            </div>
            <div className="flex justify-between">
              <span>DURATION:</span>
              <span>{formatTime(duration)}</span>
            </div>
            {setResult && (
              <>
                <div className="flex justify-between">
                  <span>REPS (THIS SET):</span>
                  <span>{setResult.reps}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="shrink-0">PERSONAL BEST:</span>
                  <span className="text-right">
                    {setResult.personalBest.reps ?? '—'}
                    {setResult.personalBest.reps !== null && (
                      <span className="block text-sm font-normal normal-case">
                        ({formatPersonalBestDate(setResult.personalBest.achievedAt)})
                      </span>
                    )}
                  </span>
                </div>
                {setResult.isNewPersonalBest && (
                  <p className="text-center text-sm font-bold text-[#CCFF00] bg-black px-2 py-1">
                    NEW PERSONAL BEST!
                  </p>
                )}
              </>
            )}
            <div className="flex justify-between">
              <span>STATUS:</span>
              <span className="text-[#FF00FF]">COOKED</span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t-4 border-black border-dashed text-center normal-case">
            <p className="text-sm font-medium leading-snug">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="text-xs font-bold mt-1.5">
              — {quote.author}
            </p>
          </div>
        </motion.div>

        <div className="w-full">
          <motion.button
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            transition={{
              delay: 0.8
            }}
            onClick={onHome}
            className="w-full bg-[#CCFF00] text-black rounded-2xl border-2 border-[#CCFF00] p-4 flex items-center justify-center gap-2 font-bold text-xl shadow-[0_0_0_1px_#CCFF00,0_0_14px_rgba(204,255,0,0.7),0_0_28px_rgba(204,255,0,0.35)] hover:shadow-[0_0_0_1px_#CCFF00,0_0_22px_rgba(204,255,0,0.95),0_0_44px_rgba(204,255,0,0.55)] hover:brightness-110 transition-all duration-200">
            
            BACK TO SUFFERING
            <ArrowRight size={24} />
          </motion.button>
        </div>
      </div>
    </div>);

}