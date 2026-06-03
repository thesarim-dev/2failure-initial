import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Flame, Loader2, LogOut, Skull, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOVE_CATEGORIES, Move, SHADY_QUOTES, resolveMove } from './moves';
import { ThemeToggle } from './ThemeToggle';

interface DashboardProps {
  coins: number;
  currentStreak: number;
  statsLoading: boolean;
  statsCompleting: boolean;
  profileLoading: boolean;
  profileError: string | null;
  statsError: string | null;
  setsError: string | null;
  setsLoading: boolean;
  equipped: Record<string, string>;
  setsCompleted: Record<string, number>;
  isDark: boolean;
  onToggleDark: () => void;
  onSelectMove: (move: Move) => void;
  onOpenStore: () => void;
}

export function Dashboard({
  coins,
  currentStreak,
  statsLoading,
  statsCompleting,
  profileLoading,
  profileError,
  statsError,
  setsError,
  setsLoading,
  equipped,
  setsCompleted,
  isDark,
  onToggleDark,
  onSelectMove,
  onOpenStore
}: DashboardProps) {
  const { signOut } = useAuth();
  const [quote] = useState(
    () => SHADY_QUOTES[Math.floor(Math.random() * SHADY_QUOTES.length)]
  );
  const activeMoves = MOVE_CATEGORIES.map((cat) =>
  resolveMove(cat, equipped[cat.id] ?? cat.variants[0].id)
  );

  return (
    <div className="flex flex-col w-full min-h-full p-4 md:p-8 max-w-2xl mx-auto pb-24">
      <header className="flex justify-between items-center mb-8 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Skull size={32} strokeWidth={2.5} className="shrink-0" />
          <h1 className="logo-brand text-3xl tracking-tighter text-[#00B2FF] normal-case truncate">
            2failure
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
          <button
            type="button"
            onClick={() => signOut()}
            className="bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-2 border-black dark:border-white p-2 brutal-shadow-sm brutal-shadow-hover transition-all"
            aria-label="Sign out">
            <LogOut size={20} strokeWidth={2.5} />
          </button>
          <button
            onClick={onOpenStore}
            className="bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-2 border-black dark:border-white p-2 brutal-shadow-sm brutal-shadow-hover transition-all"
            aria-label="Open store">
            <ShoppingBag size={20} strokeWidth={2.5} />
          </button>

          {profileLoading ?
          <div
            className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-3 py-1.5 border-2 border-black dark:border-white brutal-shadow-sm"
            aria-busy="true"
            aria-label="Loading coins">
            <Loader2 size={20} strokeWidth={2.5} className="animate-spin" />
          </div> :
          <div
            className="flex items-center gap-2 bg-[#CCFF00] text-black px-3 py-1.5 border-2 border-black brutal-shadow-sm"
            title="Coins">
            <Coins size={20} strokeWidth={2.5} aria-hidden="true" />
            <span className="font-bold tabular-nums">{coins}</span>
          </div>
          }
        </div>
      </header>

      {(profileError || statsError || setsError) &&
      <p className="mb-6 text-sm font-bold text-[#FF4D00]" role="alert">
          {setsError ?
            `Could not load set progress: ${setsError}` :
            statsError ?
            `Could not load workout stats: ${statsError}` :
            `Could not refresh profile: ${profileError}`}
        </p>
      }

      <section
        className="mb-10 flex items-center gap-4 normal-case"
        aria-label="Daily vibe check and streak">
        <div className="flex-1 min-w-0 bg-[#333333] dark:bg-[#2a2a2a] border-4 border-white dark:border-white p-5 pt-7 relative brutal-shadow-sm">
          <div className="absolute -top-3 left-4 bg-black text-white px-3 py-1 text-xs font-semibold normal-case">
            daily vibe check
          </div>
          <p className="font-medium text-base leading-snug text-white/95 pr-1">
            &ldquo;{quote}&rdquo;
          </p>
        </div>

        <div
          className="streak-badge shrink-0 w-[7.5rem] h-[7.5rem] rounded-full bg-[#FF4D00] border-4 border-white flex flex-col items-center justify-center text-black"
          aria-label={`Current streak: ${currentStreak} days`}>
          {statsLoading || statsCompleting ?
          <Loader2 size={28} className="animate-spin" aria-busy="true" /> :
          <>
            <div className="flex items-center gap-1 leading-none">
              <Flame size={22} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
              <span className="text-4xl font-bold tabular-nums">{currentStreak}</span>
            </div>
            <span className="text-sm font-semibold mt-1">streak</span>
          </>
          }
        </div>
      </section>

      <div className="space-y-8">
        <h2 className="text-2xl mb-4">PICK YOUR POISON</h2>

        {activeMoves.map((move, i) =>
        <motion.button
          key={move.id}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => onSelectMove(move)}
          className={`w-full text-left rounded-2xl ${move.color} ${move.glow} border-4 p-5 transition-all duration-200 group relative overflow-visible hover:brightness-[1.03]`}>
          
            <div className="relative z-10">
              <div className="flex justify-between items-end gap-2 mb-2 min-w-0">
                <h3 className="text-[clamp(0.95rem,4.5vw,1.875rem)] leading-none whitespace-nowrap min-w-0 flex-1">
                  {move.name}
                </h3>
                <span className="bg-black text-white px-2.5 py-1 text-xs font-bold tabular-nums rounded-md shrink-0 normal-case">
                  {setsLoading ?
                    '…' :
                    `${setsCompleted[move.categoryId] ?? 0} / 3 sets`}
                </span>
              </div>
              <p className="font-medium text-black/80">{move.description}</p>
            </div>

            <div className="absolute -right-10 -bottom-10 opacity-0 group-hover:opacity-20 transition-opacity duration-300 transform group-hover:scale-150">
              <Skull size={120} />
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
}
