import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, Flame, Loader2, Settings as SettingsIcon, ShoppingBag } from 'lucide-react';
import { FailureLogo } from './FailureLogo';
import { CoinsBadge } from './CoinsBadge';
import { useLanguage } from '../context/LanguageContext';
import { localizeMove } from '../i18n/localize';
import type { DailySetGoal } from '../hooks/useDailySetGoal';
import type { RotatingProgramPhase } from '../lib/rotatingProgram';
import { pickFunFact } from '../lib/funFacts';
import { PUSHUP_DAILY_GOAL } from '../lib/pushupDailyProgress';
import { STREAK_RESTORE_MIN_LENGTH, isStreakBroken } from '../lib/userStats';
import { Move, getVariantById, resolveLineupMove } from './moves';

interface DashboardProps {
  coins: number;
  currentStreak: number;
  statsLoading: boolean;
  statsCompleting: boolean;
  restoringStreak: boolean;
  lastWorkoutDate: string | null;
  restoreStreakCost: number;
  onRestoreStreak: () => void;
  profileLoading: boolean;
  profileError: string | null;
  statsError: string | null;
  setsError: string | null;
  setsLoading: boolean;
  equippedUpper: string[];
  equippedLower: string[];
  equippedCore: string[];
  equippedRecovery: string[];
  setsCompleted: Record<string, number>;
  dailySetGoal: DailySetGoal;
  programSetsToFailure: Record<string, number>;
  rotatingProgramEnabled: boolean;
  rotatingProgramPhase: RotatingProgramPhase | null;
  rotatingProgramCycleDay: number | null;
  rotationCycleLength: number;
  isRestDayToday: boolean;
  canTakeRestDay: boolean;
  restDaysRemainingThisWeek: number;
  onTakeRestDay: () => void;
  pushupRepsToday: number;
  pushupRepsLoading: boolean;
  onSelectMove: (move: Move) => void;
  onOpenStore: () => void;
  onOpenSettings: () => void;
}

export function Dashboard({
  coins,
  currentStreak,
  statsLoading,
  statsCompleting,
  restoringStreak,
  lastWorkoutDate,
  restoreStreakCost,
  onRestoreStreak,
  profileLoading,
  profileError,
  statsError,
  setsError,
  setsLoading,
  equippedUpper,
  equippedLower,
  equippedCore,
  equippedRecovery,
  setsCompleted,
  dailySetGoal,
  programSetsToFailure,
  rotatingProgramEnabled,
  rotatingProgramPhase,
  rotatingProgramCycleDay,
  rotationCycleLength,
  isRestDayToday,
  canTakeRestDay,
  restDaysRemainingThisWeek,
  onTakeRestDay,
  pushupRepsToday,
  pushupRepsLoading,
  onSelectMove,
  onOpenStore,
  onOpenSettings
}: DashboardProps) {
  const { t, language, isRtl } = useLanguage();
  const funFact = useMemo(
    () => pickFunFact(t.dashboard.funFacts.facts, t.dashboard.funFacts.loading),
    [language, t.dashboard.funFacts.facts, t.dashboard.funFacts.loading]
  );

  const canRestoreStreak =
    currentStreak >= STREAK_RESTORE_MIN_LENGTH && isStreakBroken(lastWorkoutDate);

  const activeMoves = useMemo(
    () =>
      [
        ...equippedUpper.map((id) => resolveLineupMove(id)),
        ...equippedLower.map((id) => resolveLineupMove(id)),
        ...equippedCore.map((id) => resolveLineupMove(id)),
        ...equippedRecovery.map((id) => resolveLineupMove(id))
      ].map((move) => localizeMove(move, t.moves)),
    [equippedUpper, equippedLower, equippedCore, equippedRecovery, t.moves, language]
  );

  return (
    <div className="flex flex-col w-full min-h-full p-4 md:p-8 max-w-2xl mx-auto pb-24">
      <header className="relative flex justify-between items-center mb-8 gap-3">
        <div className="flex items-center gap-2 min-w-0 pe-2 pointer-events-none select-none">
          <FailureLogo size={32} className="failure-logo-glow shrink-0" />
          <h1 className="logo-brand text-3xl tracking-tighter text-[#00A8D8] dark:text-[#00B2FF] normal-case whitespace-nowrap dashboard-logo-glow">
            2failure
          </h1>
        </div>

        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenStore}
            className="cyber-icon-btn cyber-icon-btn--store"
            aria-label={t.dashboard.aria.openStore}>
            <ShoppingBag size={20} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="cyber-icon-btn cyber-icon-btn--settings"
            aria-label={t.dashboard.aria.openSettings}>
            <SettingsIcon size={20} strokeWidth={2.5} />
          </button>

          {profileLoading ? (
            <div
              className="coins-badge flex items-center gap-2 px-4 py-2"
              aria-busy="true"
              aria-label={t.dashboard.aria.loadingCoins}>
              <Loader2 size={20} strokeWidth={2.5} className="animate-spin" />
            </div>
          ) : (
            <CoinsBadge coins={coins} />
          )}
        </div>
      </header>

      {(profileError || statsError || setsError) && (
        <p className="mb-6 text-sm font-bold text-[#B83810]" role="alert">
          {setsError
            ? t.dashboard.errors.sets(setsError)
            : statsError
              ? t.dashboard.errors.stats(statsError)
              : t.dashboard.errors.profile(profileError ?? '')}
        </p>
      )}

      <section
        className="mb-6 flex items-center gap-4 normal-case"
        aria-label={t.dashboard.aria.funFactAndStreak}>
        <div className="cyber-panel flex-1 min-w-0 p-5 normal-case text-start">
          <p className="font-medium text-base leading-snug opacity-90">
            {funFact}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className="streak-badge shrink-0 w-[78px] h-[78px] rounded-full bg-[#E85520] dark:bg-[#FF6633] flex flex-col items-center justify-center text-black"
            aria-label={t.dashboard.aria.streakDays(currentStreak)}>
            {statsLoading || statsCompleting ? (
              <Loader2 size={18} className="animate-spin" aria-busy="true" />
            ) : (
              <>
                <div className="flex items-center gap-0.5 leading-none">
                  <Flame size={15} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
                  <span className="text-2xl font-bold tabular-nums">{currentStreak}</span>
                </div>
                <span className="text-[11px] font-semibold mt-0.5 leading-none">
                  {t.dashboard.streak}
                </span>
              </>
            )}
          </div>

          {canRestoreStreak && (
            <button
              type="button"
              onClick={onRestoreStreak}
              disabled={restoringStreak || coins < restoreStreakCost}
              className="rounded-full border border-[#E85520] dark:border-[#FF6633] bg-white/80 dark:bg-[#2a2a2a]/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#B83810] dark:text-[#FFB38A] disabled:cursor-not-allowed disabled:opacity-60">
              {restoringStreak ? t.dashboard.streakRestore.loading : t.dashboard.streakRestore.label}
              <span className="ml-1">{t.dashboard.streakRestore.cost(restoreStreakCost)}</span>
            </button>
          )}
        </div>
      </section>

      <div>
        {rotatingProgramEnabled &&
          rotatingProgramPhase !== null &&
          rotatingProgramCycleDay !== null && (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#00A8D8] dark:text-[#00B2FF] normal-case text-start">
                {isRestDayToday
                  ? t.dashboard.restDay.active
                  : t.dashboard.rotatingProgramFocus(
                      rotatingProgramCycleDay,
                      rotationCycleLength,
                      t.settings.rotatingProgram.phases[rotatingProgramPhase]
                    )}
              </p>
              {!isRestDayToday && canTakeRestDay && (
                <button
                  type="button"
                  onClick={onTakeRestDay}
                  className="rest-day-btn rounded-full border border-[#00A8D8] dark:border-[#00B2FF] bg-white/80 dark:bg-[#2a2a2a]/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#007A9E] dark:text-[#7ADCFF] normal-case">
                  <span className="flex items-center gap-1.5">
                    <BedDouble size={13} strokeWidth={2.5} aria-hidden="true" />
                    {t.dashboard.restDay.button}
                    <span className="opacity-70">
                      {t.dashboard.restDay.remaining(restDaysRemainingThisWeek)}
                    </span>
                  </span>
                </button>
              )}
            </div>
          )}
        <h2 className="text-2xl mb-2 normal-case text-start">
          {t.dashboard.pickYourPoison}
        </h2>

        <div className="flex flex-col gap-4">
          {activeMoves.map((move, i) => {
            const completed = setsCompleted[move.categoryId] ?? 0;
            const programGoal = programSetsToFailure[move.categoryId];
            const isProgramMode =
              rotatingProgramEnabled && programGoal !== undefined;
            const isDone = isProgramMode && completed >= programGoal;
            const variant = getVariantById(move.id);
            const equipmentLabel =
              isProgramMode && variant?.equipment?.length
                ? t.dashboard.programEquipment(
                    variant.equipment
                      .map((item) => t.dashboard.equipment[item])
                      .join(' + ')
                  )
                : null;

            return (
            <motion.button
              key={move.id}
              initial={{ x: isRtl ? 50 : -50, opacity: 0 }}
              animate={{ x: 0, opacity: isDone ? 0.55 : 1, scale: 1, y: 0 }}
              whileHover={
                isDone ? undefined : { scale: 1.03, y: -4 }
              }
              whileTap={isDone ? undefined : { scale: 0.98, y: 0 }}
              whileFocus={isDone ? undefined : { scale: 1.02, y: -2 }}
              transition={{
                x: { delay: i * 0.1 },
                opacity: { delay: i * 0.1 },
                default: {
                  type: 'spring',
                  stiffness: 520,
                  damping: 26,
                  mass: 0.55
                }
              }}
              onClick={() => onSelectMove(move)}
              disabled={isDone}
              className={`dashboard-move-card w-full text-start rounded-2xl ${move.color} ${move.glow} border-4 p-5 relative overflow-visible disabled:cursor-default`}>
              <div className="relative z-10">
                <div className="dashboard-move-header mb-2 min-w-0">
                  <h3 className="dashboard-move-title flex-1 min-w-0 uppercase">
                    {move.name}
                  </h3>
                  <span className="dashboard-move-sets bg-black text-white px-2.5 py-1 text-xs font-bold tabular-nums rounded-md normal-case shrink-0">
                    {setsLoading
                      ? t.dashboard.loading
                      : isDone
                        ? t.dashboard.programExerciseDone
                        : t.dashboard.setsProgress(
                              completed,
                              isProgramMode ? programGoal : dailySetGoal
                            )}
                  </span>
                </div>
                {equipmentLabel && (
                  <p className="text-xs font-bold uppercase tracking-wide text-black/60 mb-1">
                    {equipmentLabel}
                  </p>
                )}
                {move.id === 'pushups' && (
                  <p className="dashboard-pushup-progress text-xs font-bold tabular-nums text-black/70 mb-1">
                    {pushupRepsLoading
                      ? t.dashboard.loading
                      : t.dashboard.pushupDailyProgress(
                          pushupRepsToday,
                          PUSHUP_DAILY_GOAL
                        )}
                  </p>
                )}
                <p className="dashboard-move-desc font-medium text-black/80 leading-snug">
                  {move.description}
                </p>
              </div>
            </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
