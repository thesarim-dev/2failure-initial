import { RestTicket } from './RestTicket';
import { HudStrip } from './HudStrip';
import { StreakFlame } from './StreakFlame';
import { ResourceIcon } from './game/BaseScreen';
import { PATTERN_RESOURCE, RESOURCE_IDS, type Resources } from '../game/catalog';
import { patternForMove } from '../game/useBaseGame';
import { useMemo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2} from 'lucide-react';
import { FailureLogo } from './FailureLogo';
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
  /** Today's completed sets by plan slot, keyed by the slot's current exercise. */
  slotDone?: Record<string, number> | null;
  dailySetGoal: DailySetGoal;
  programSetsToFailure: Record<string, number>;
  rotatingProgramEnabled: boolean;
  rotatingProgramPhase: RotatingProgramPhase | null;
  rotatingProgramCycleDay: number | null;
  rotationCycleLength: number;
  /** The plan's training days in order (for the week tile). */
  rotationCycle: readonly string[];
  /** Today at a glance (null on rest days): progress and the next set. */
  dayProgress?: {
    done: number;
    total: number;
    minutesLeft: number;
  } | null;
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
}

/** Week-tile colours per training day (written out so the CSS build keeps them). */
const WEEK_BLOCK: Record<string, string> = {
  push: 'wk-push',
  pull: 'wk-pull',
  legs: 'wk-legs',
  mixed: 'wk-mixed',
  recovery: 'wk-recovery'
};

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
  slotDone,
  dailySetGoal,
  programSetsToFailure,
  rotatingProgramEnabled,
  rotatingProgramPhase,
  rotatingProgramCycleDay,
  rotationCycleLength,
  rotationCycle,
  dayProgress = null,
  isRestDayToday,
  canTakeRestDay,
  restDaysRemainingThisWeek,
  onTakeRestDay,
  pushupRepsToday,
  pushupRepsLoading,
  onSelectMove,
  onOpenPlan
}: DashboardProps) {
  const { t, language, isRtl } = useLanguage();
  const rewardFor = (move: Move) => {
    const pattern = patternForMove(move);
    return pattern === 'recovery' ? RESOURCE_IDS : [PATTERN_RESOURCE[pattern]];
  };
  const rewardLabel = (move: Move) => rewardFor(move).map((id) => t.game.resources[id]).join(' · ');
  // The current plan, in one line: own plan (sets a day) or program (which day).
  // Today's day for the Edit plan chip, and the rest-day dots (total for the week).
  const todayChip =
    isRestDayToday || !rotatingProgramPhase || rotatingProgramPhase === 'recovery'
      ? t.hub.plan.tileSub(rotationCycleLength)
      : t.hub.plan.dayNames[rotatingProgramPhase];
  const todayIndex = (Math.max(1, rotatingProgramCycleDay ?? 1) - 1) % Math.max(1, rotationCycle.length);
  const restDotsTotal = Math.min(5, Math.max(restDaysRemainingThisWeek, 7 - rotationCycleLength, 1));

  // Night falls when a rest day starts during this visit (not when you open the app on one).
  const [nightFalling, setNightFalling] = useState(false);
  const wasResting = useRef(isRestDayToday);
  useEffect(() => {
    if (!wasResting.current && isRestDayToday) {
      setNightFalling(true);
      const timer = window.setTimeout(() => setNightFalling(false), 3200);
      wasResting.current = true;
      return () => window.clearTimeout(timer);
    }
    wasResting.current = isRestDayToday;
  }, [isRestDayToday]);

  // Lit once today's streak is safe: trained today, or a planned rest day.
  const streakProtectedToday = lastWorkoutDate === toLocalDateString() || isRestDayToday;


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
    <div className="home-root flex flex-col w-full min-h-full p-4 md:p-8 max-w-2xl mx-auto pb-24">
      {/* Rest day: the sky turns to night (dusk sweeps down, stars come out, the moon rises). */}
      <div className={`rest-sky ${isRestDayToday ? 'is-on' : ''} ${nightFalling ? 'is-falling' : ''}`} aria-hidden="true">
        <span className="rest-stars" />
        <span className="rest-stars rest-stars--late" />
        <span className="rest-moon" />
        {nightFalling && <span className="rest-dusk" />}
      </div>
      <header className="relative flex justify-between items-center mb-8 gap-3">
        <div className="flex items-center gap-2 min-w-0 pe-2 pointer-events-none select-none">
          <FailureLogo size={32} className="failure-logo-glow shrink-0" />
          <h1 className="logo-brand dashboard-wordmark text-3xl tracking-tighter text-[#00A8D8] dark:text-[#00B2FF] normal-case whitespace-nowrap dashboard-logo-glow">
            2failure
          </h1>
        </div>

        <div className="relative z-10 flex items-center gap-2 shrink-0">
          {/* One game-style resource bar (materials and coins). */}
          <HudStrip
            materials={materials}
            coins={coins}
            coinsLoading={profileLoading}
            label={[...RESOURCE_IDS.map((id) => `${materials[id]} ${t.game.resources[id]}`), `${coins} ${t.coins.title}`].join(', ')}
          />
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

      {/* One row: rest day · the streak (centrepiece) · edit your workout. */}
      <section className="home-trio mb-4 normal-case" aria-label={t.dashboard.aria.funFactAndStreak}>
        {/* Rest days are a weekly allowance you spend: a ticket you tear off. */}
        <RestTicket
          canTake={canTakeRestDay}
          resting={isRestDayToday}
          left={restDaysRemainingThisWeek}
          slots={restDotsTotal}
          onTake={onTakeRestDay}
          copy={{
            kicker: t.hub.trio.restKicker,
            left: t.hub.trio.left(restDaysRemainingThisWeek),
            none: t.hub.trio.none,
            slide: `${t.hub.trio.slide} →`,
            restDay: t.hub.trio.restDay,
            safe: t.hub.trio.safe,
            take: t.dashboard.restDay.button
          }}
        />
        <div
          data-tour="streak"
          className="trio-streak"
          aria-label={t.dashboard.aria.streakDays(currentStreak)}>
          <span className={`trio-pedestal ${streakProtectedToday ? 'is-lit' : ''}`} aria-hidden="true" />
          {statsLoading || statsCompleting ? (
            <Loader2 size={22} className="animate-spin" aria-busy="true" />
          ) : (
            <StreakFlame count={currentStreak} lit={streakProtectedToday} label={t.dashboard.streak} size="lg" />
          )}
        </div>

        {/* Your week at a glance: one block per training day, today raised. */}
        <button
          type="button"
          className="act-tile act-plan week-tile"
          data-tour="store"
          onClick={onOpenPlan}
          aria-label={`${t.hub.trio.planTitle}: ${todayChip}`}>
          <span className="tile-kicker">{t.hub.trio.yourWeek}</span>
          <span className="week-blocks" aria-hidden="true">
            {rotationCycle.map((phase, k) => (
              <i key={k} className={`wk ${WEEK_BLOCK[phase] ?? ''} ${!isRestDayToday && k === todayIndex ? 'is-today' : ''}`} />
            ))}
          </span>
          <span className="tile-main">{todayChip}</span>
          <span className="tile-cta">{t.hub.trio.planTitle} →</span>
        </button>
      </section>

      {/* Streak broke: a clear banner to bring it back (before the 2nd set today). */}
      {canRestoreStreak && (
        <section className="streak-restore-banner mb-4 normal-case" role="status">
          <p className="streak-restore-title">
            <span aria-hidden="true">🔥</span> {t.hub.restoreBanner.title(Math.max(currentStreak, longestStreak))}
          </p>
          <p className="streak-restore-sub">{t.hub.restoreBanner.sub}</p>
          <div className="streak-restore-actions">
            {shields > 0 && (
              <button type="button" onClick={onUseShield} disabled={restoringStreak} className="streak-restore-btn is-shield">
                {t.game.lodge.useShield(shields)}
              </button>
            )}
            <button
              type="button"
              onClick={onRestoreStreak}
              disabled={restoringStreak || coins < restoreStreakCost}
              className="streak-restore-btn is-coins">
              {restoringStreak
                ? t.dashboard.streakRestore.loading
                : coins < restoreStreakCost
                  ? t.hub.restoreBanner.notEnough(restoreStreakCost)
                  : t.dashboard.streakRestore.cost(restoreStreakCost)}
            </button>
          </div>
        </section>
      )}

      <div key={isRestDayToday ? 'rest' : 'train'} className={nightFalling ? 'day-handover' : undefined}>
        {/* Today's day from Your plan: e.g. PUSH DAY · Chest, shoulders, triceps */}
        <div className="day-heading" data-tour="program">
          {rotatingProgramCycleDay !== null && !isRestDayToday && (
            <span className="day-heading-kicker">
              {t.hub.plan.dayLabel(((rotatingProgramCycleDay - 1) % Math.max(1, rotationCycleLength)) + 1)} / {rotationCycleLength}
            </span>
          )}
          <h2 className="text-2xl normal-case text-start">
            {isRestDayToday
              ? t.hub.trio.restDay
              : !rotatingProgramPhase || rotatingProgramPhase === 'recovery'
                ? t.dashboard.restDay.button
                : t.hub.plan.dayNames[rotatingProgramPhase]}
          </h2>
          <p className="day-heading-sub">
            {isRestDayToday || !rotatingProgramPhase || rotatingProgramPhase === 'recovery'
              ? t.hub.plan.rest
              : t.hub.plan.focus[rotatingProgramPhase]}
          </p>
        </div>

        {/* Today at a glance: sets done and roughly how long is left. */}
        {dayProgress && !isRestDayToday && (
          <section className="today-glance" aria-label={t.upNext.progress(dayProgress.done, dayProgress.total)}>
            {/* The day's progress, above the exercise list. */}
            <div className="today-progress">
              <div className="today-bar" aria-hidden="true">
                <i style={{ width: `${(dayProgress.done / Math.max(1, dayProgress.total)) * 100}%` }} />
              </div>
              <p className="today-meta">
                <span>{t.upNext.progress(dayProgress.done, dayProgress.total)}</span>
                {dayProgress.done < dayProgress.total && <span>{t.upNext.minutes(dayProgress.minutesLeft)}</span>}
              </p>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-4">
          {activeMoves.map((move, i) => {
            // Progress belongs to the plan slot: switching exercises keeps it.
            const completed = slotDone?.[move.categoryId] ?? setsCompleted[move.categoryId] ?? 0;
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
