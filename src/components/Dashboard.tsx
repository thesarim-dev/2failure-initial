import { WeekStrip } from './WeekStrip';
import { StreakFlame } from './StreakFlame';
import { ResourceIcon } from './game/BaseScreen';
import { PATTERN_RESOURCE, RESOURCE_IDS, type Resources } from '../game/catalog';
import { patternForMove } from '../game/useBaseGame';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, ChevronRight, Loader2 } from 'lucide-react';
import planIcon from '../assets/plan-icon.png';
import { FailureLogo } from './FailureLogo';
import { CoinsBadge } from './CoinsBadge';
import { useLanguage } from '../context/LanguageContext';
import { localizeMove } from '../i18n/localize';
import type { DailySetGoal } from '../hooks/useDailySetGoal';
import type { RotatingProgramPhase } from '../lib/rotatingProgram';
import { PUSHUP_DAILY_GOAL } from '../lib/pushupDailyProgress';
import { canOfferStreakRestore, toLocalDateString } from '../lib/userStats';
import { sumDailySets } from '../lib/workoutProgress';
import { Move, getVariantById, resolveLineupMove } from './moves';

interface DashboardProps {
  coins: number;
  /** Building materials for the base, shown in a pill next to coins. */
  materials: Resources;
  currentStreak: number;
  longestStreak: number;
  statsLoading: boolean;
  statsCompleting: boolean;
  restoringStreak: boolean;
  lastWorkoutDate: string | null;
  restoreStreakCost: number;
  /** Rest days per 7 days that don't break the streak. */
  restAllowance: number;
  recentRestDays: string[];
  /** Lodge streak shields available (free restores). */
  shields: number;
  onUseShield: () => void;
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
  /** Training screen, Plan tab. */
  onOpenPlan: () => void;
  trainingDaysPerWeek: number;
  /** App days trained this week, and the weekly target, for "This week". */
  weekTrainingDays: string[];
  weeklyTarget: number;
}

export function Dashboard({
  coins,
  materials,
  currentStreak,
  longestStreak,
  statsLoading,
  statsCompleting,
  restoringStreak,
  lastWorkoutDate,
  restoreStreakCost,
  restAllowance,
  recentRestDays,
  shields,
  onUseShield,
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
  onOpenPlan,
  trainingDaysPerWeek,
  weekTrainingDays,
  weeklyTarget
}: DashboardProps) {
  const { t, language, isRtl } = useLanguage();
  const rewardFor = (move: Move) => {
    const pattern = patternForMove(move);
    return pattern === 'recovery' ? RESOURCE_IDS : [PATTERN_RESOURCE[pattern]];
  };
  const rewardLabel = (move: Move) => rewardFor(move).map((id) => t.game.resources[id]).join(' · ');
  // The current plan, in one line: own plan (sets a day) or program (which day).
  // Lit once today's streak is safe: trained today, or a planned rest day.
  const streakProtectedToday = lastWorkoutDate === toLocalDateString() || isRestDayToday;

  const planLine = rotatingProgramEnabled
    ? isRestDayToday || !rotatingProgramPhase || rotatingProgramPhase === 'recovery'
      ? t.hub.dashCard.programRest(rotationCycleLength)
      : t.hub.dashCard.program(
          rotationCycleLength,
          // Already 1-based, matching the program banner ("Program day 1/5").
          rotatingProgramCycleDay ?? 1,
          t.settings.rotatingProgram.phases[rotatingProgramPhase]
        )
    : t.hub.dashCard.own(dailySetGoal, trainingDaysPerWeek);

  const totalSetsToday = useMemo(
    () => sumDailySets(setsCompleted),
    [setsCompleted]
  );
  const canRestoreStreak =
    !statsLoading &&
    !setsLoading &&
    canOfferStreakRestore(
      {
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_workout_date: lastWorkoutDate
      },
      totalSetsToday,
      undefined,
      { restAllowance, recentRestDays }
    );

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
          <h1 className="logo-brand dashboard-wordmark text-3xl tracking-tighter text-[#00A8D8] dark:text-[#00B2FF] normal-case whitespace-nowrap dashboard-logo-glow">
            2failure
          </h1>
        </div>

        <div className="relative z-10 flex items-center gap-2 shrink-0">
          {/* Same look as the coins pill; display only. */}
          <div
            className="coins-badge materials-badge flex items-center px-3 py-2"
            role="img"
            aria-label={RESOURCE_IDS.map((id) => `${materials[id]} ${t.game.resources[id]}`).join(', ')}>
            {RESOURCE_IDS.map((id) => (
              <span key={id} className="materials-badge-item">
                <ResourceIcon id={id} size={18} />
                <span className="font-bold tabular-nums">{materials[id]}</span>
              </span>
            ))}
          </div>

          {profileLoading ? (
            <div
              data-tour="coins"
              className="coins-badge flex items-center gap-2 px-4 py-2"
              aria-busy="true"
              aria-label={t.dashboard.aria.loadingCoins}>
              <Loader2 size={20} strokeWidth={2.5} className="animate-spin" />
            </div>
          ) : (
            <span data-tour="coins" className="inline-flex rounded-full">
              <CoinsBadge coins={coins} />
            </span>
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

      {/* Row 1: this week, with the streak beside it. */}
      <section className="mb-4 flex items-center gap-3 normal-case" aria-label={t.dashboard.aria.funFactAndStreak}>
        <div className="flex-1 min-w-0">
          <WeekStrip
            compact
            weekTrainingDays={weekTrainingDays}
            recentRestDays={recentRestDays}
            isRestDayToday={isRestDayToday}
            totalSetsToday={totalSetsToday}
            weeklyTarget={weeklyTarget}
          />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            data-tour="streak"
            className="streak-flame-wrap shrink-0 flex items-center justify-center"
            aria-label={t.dashboard.aria.streakDays(currentStreak)}>
            {statsLoading || statsCompleting ? (
              <Loader2 size={18} className="animate-spin" aria-busy="true" />
            ) : (
              <StreakFlame count={currentStreak} lit={streakProtectedToday} label={t.dashboard.streak} />
            )}
          </div>

          {canRestoreStreak && shields > 0 && (
            <button
              type="button"
              onClick={onUseShield}
              disabled={restoringStreak}
              className="rounded-full border border-[#F2A541] bg-white/80 dark:bg-[#2a2a2a]/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8A4F00] dark:text-[#FFC784] disabled:cursor-not-allowed disabled:opacity-60">
              {t.game.lodge.useShield(shields)}
            </button>
          )}
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

      {/* Row 2: rest day and the plan, side by side, centred. */}
      <div className="dashboard-actions-row mb-5 normal-case">
        {!isRestDayToday && canTakeRestDay && (
          <button type="button" onClick={onTakeRestDay} className="rest-day-tile normal-case">
            <BedDouble size={20} strokeWidth={2.5} aria-hidden="true" />
            <span className="rest-day-tile-label">{t.dashboard.restDay.button}</span>
            <span className="rest-day-tile-left">{t.dashboard.restDay.remaining(restDaysRemainingThisWeek)}</span>
          </button>
        )}
        <button
          type="button"
          className="plan-card plan-card--compact cyber-panel normal-case text-start"
          data-tour="store"
          onClick={onOpenPlan}>
          <img src={planIcon} alt="" aria-hidden="true" className="plan-card-icon" width={40} height={40} />
          <span className="plan-card-text">
            <span className="plan-card-title">{t.hub.dashCard.title}</span>
            <span className="plan-card-meta">
              <span className={`plan-card-badge ${rotatingProgramEnabled ? 'is-program' : 'is-own'}`}>
                {rotatingProgramEnabled ? t.hub.dashCard.programBadge : t.hub.dashCard.ownBadge}
              </span>
              <span className="plan-card-line">{planLine}</span>
            </span>
          </span>
          <ChevronRight size={18} strokeWidth={2.5} className="plan-card-chevron tour-icon-flip" aria-hidden="true" />
        </button>
      </div>

      <div>
        {isRestDayToday && (
          <p className="mb-2 text-sm font-semibold text-[#00A8D8] dark:text-[#00B2FF] normal-case text-center">
            {rotatingProgramEnabled ? t.dashboard.restDay.active : t.dashboard.restDay.activeFree}
          </p>
        )}
        {rotatingProgramEnabled && !isRestDayToday && rotatingProgramPhase !== null && rotatingProgramCycleDay !== null && (
          <p data-tour="program" className="mb-2 text-sm font-semibold text-[#00A8D8] dark:text-[#00B2FF] normal-case text-start">
            {t.dashboard.rotatingProgramFocus(
              rotatingProgramCycleDay,
              rotationCycleLength,
              t.settings.rotatingProgram.phases[rotatingProgramPhase]
            )}
          </p>
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
              data-tour="move"
              data-tour-name={move.name}
              className={`dashboard-move-card w-full text-start rounded-2xl ${move.color} ${move.glow} border-4 p-5 relative overflow-visible disabled:cursor-default`}>
              <div className="relative z-10">
                <div className="dashboard-move-header mb-2 min-w-0">
                  <div className="dashboard-move-name-row">
                    <h3 className="dashboard-move-title min-w-0 uppercase">{move.name}</h3>
                    {/* What this exercise earns for the base. */}
                    <span className="dashboard-move-reward" title={rewardLabel(move)}>
                      {rewardFor(move).map((id) => (
                        <ResourceIcon key={id} id={id} size={20} />
                      ))}
                      <span className="sr-only">{rewardLabel(move)}</span>
                    </span>
                  </div>
                  <span
                    data-tour={i === 0 ? 'lineup' : undefined}
                    className="dashboard-move-sets bg-black text-white px-2.5 py-1 text-xs font-bold tabular-nums rounded-md normal-case shrink-0">
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
