import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Move } from './moves';
import { Share2, ArrowRight, Skull } from 'lucide-react';
import confetti from 'canvas-confetti';
interface SummaryProps {
  move: Move;
  duration: number;
  onHome: () => void;
}
export function Summary({ move, duration, onHome }: SummaryProps) {
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
            <p className="text-center text-sm font-bold mt-1 normal-case">
              <span className="logo-brand">2failure</span> anti-gym
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
            <div className="flex justify-between">
              <span>STATUS:</span>
              <span className="text-[#FF00FF]">COOKED</span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t-4 border-black border-dashed text-center">
            <p className="text-sm font-bold">
              "I just failed on a bathroom floor. What did you do today?"
            </p>
          </div>
        </motion.div>

        <div className="w-full space-y-4">
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
            className="w-full bg-[#CCFF00] text-black border-4 border-[#CCFF00] p-4 flex items-center justify-center gap-2 font-bold text-xl hover:bg-transparent hover:text-[#CCFF00] transition-colors">
            
            <Share2 size={24} />
            FLEX YOUR FAILURE
          </motion.button>

          <motion.button
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            transition={{
              delay: 0.9
            }}
            onClick={onHome}
            className="w-full bg-transparent text-white border-4 border-white p-4 flex items-center justify-center gap-2 font-bold text-xl hover:bg-white hover:text-black transition-colors">
            
            BACK TO SUFFERING
            <ArrowRight size={24} />
          </motion.button>
        </div>
      </div>
    </div>);

}