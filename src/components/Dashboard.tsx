import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Loader2, Settings as SettingsIcon, Skull, ShoppingBag } from 'lucide-react';
import { CoinsBadge } from './CoinsBadge';
import type { DailySetGoal } from '../hooks/useDailySetGoal';
import { pickFunFact } from '../lib/funFacts';
import { Move, resolveLineupMove } from './moves';

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
  equippedUpper: string[];
  equippedLower: string[];
  equippedCore: string[];
  setsCompleted: Record<string, number>;
  dailySetGoal: DailySetGoal;
  onSelectMove: (move: Move) => void;
  onOpenStore: () => void;
  onOpenSettings: () => void;
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
  equippedUpper,
  equippedLower,
  equippedCore,
  setsCompleted,
  dailySetGoal,
  onSelectMove,
  onOpenStore,
  onOpenSettings
}: DashboardProps) {
  const [funFact] = useState(() => pickFunFact());

  const activeMoves = [
    ...equippedUpper.map((id) => resolveLineupMove(id)),
    ...equippedLower.map((id) => resolveLineupMove(id)),
    ...equippedCore.map((id) => resolveLineupMove(id))
  ];

  return (
    <div className="flex flex-col w-full min-h-full p-4 md:p-8 max-w-2xl mx-auto pb-24">
      <header className="relative flex justify-between items-center mb-8 gap-3">
        <div className="flex items-center gap-2 min-w-0 pr-2 pointer-events-none select-none">
          <Skull
            size={32}
            strokeWidth={2.5}
            className="dashboard-skull-glow shrink-0 text-[#00B2FF]"
          />
          <h1 className="logo-brand text-3xl tracking-tighter text-[#00B2FF] normal-case whitespace-nowrap dashboard-logo-glow">
            2failure
          </h1>
        </div>

        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenStore}
            className="cyber-icon-btn cyber-icon-btn--store"
            aria-label="Open store">
            <ShoppingBag size={20} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="cyber-icon-btn cyber-icon-btn--settings"
            aria-label="Open settings">
            <SettingsIcon size={20} strokeWidth={2.5} />
          </button>

          {profileLoading ? (
            <div
              className="coins-badge flex items-center gap-2 px-4 py-2"
              aria-busy="true"
              aria-label="Loading coins">
              <Loader2 size={20} strokeWidth={2.5} className="animate-spin" />
            </div>
          ) : (
            <CoinsBadge coins={coins} />
          )}
        </div>
      </header>

      {(profileError || statsError || setsError) && (
        <p className="mb-6 text-sm font-bold text-[#FF4D00]" role="alert">
          {setsError
            ? `Could not load set progress: ${setsError}`
            : statsError
              ? `Could not load workout stats: ${statsError}`
              : `Could not refresh profile: ${profileError}`}
        </p>
      )}

      <section
        className="mb-6 flex items-center gap-4 normal-case"
        aria-label="Fun fact and streak">
        <div className="cyber-panel flex-1 min-w-0 p-5 normal-case">
          <p className="font-medium text-base leading-snug opacity-90">
            {funFact}
          </p>
        </div>

        <div
          className="streak-badge shrink-0 w-[78px] h-[78px] rounded-full bg-[#FF4D00] dark:bg-[#FF6633] flex flex-col items-center justify-center text-black"
          aria-label={`Current streak: ${currentStreak} days`}>
          {statsLoading || statsCompleting ? (
            <Loader2 size={18} className="animate-spin" aria-busy="true" />
          ) : (
            <>
              <div className="flex items-center gap-0.5 leading-none">
                <Flame size={15} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
                <span className="text-2xl font-bold tabular-nums">{currentStreak}</span>
              </div>
              <span className="text-[11px] font-semibold mt-0.5 leading-none">streak</span>
            </>
          )}
        </div>
      </section>

      <div>
        <h2 className="text-2xl mb-2">PICK YOUR POISON</h2>

        <div className="flex flex-col gap-4">
        {activeMoves.map((move, i) => (
          <motion.button
            key={move.id}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelectMove(move)}
            className={`w-full text-left rounded-2xl ${move.color} ${move.glow} border-4 p-5 transition-all duration-200 group relative overflow-visible hover:brightness-[1.03]`}>
            <div className="relative z-10">
              <div className="flex justify-between items-start gap-2 mb-2 min-w-0">
                <h3 className="text-[clamp(0.95rem,4.5vw,1.875rem)] leading-none whitespace-nowrap min-w-0 flex-1">
                  {move.name}
                </h3>
                <span className="bg-black text-white px-2.5 py-1 text-xs font-bold tabular-nums rounded-md normal-case shrink-0">
                  {setsLoading
                    ? '…'
                    : `${setsCompleted[move.categoryId] ?? 0} / ${dailySetGoal} sets`}
                </span>
              </div>
              <p className="font-medium text-black/80 leading-snug">{move.description}</p>
            </div>

            <div className="absolute -right-10 -bottom-10 opacity-0 group-hover:opacity-20 transition-opacity duration-300 transform group-hover:scale-150">
              <Skull size={120} />
            </div>
          </motion.button>
        ))}
        </div>
      </div>
    </div>
  );
}
