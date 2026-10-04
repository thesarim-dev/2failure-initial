import { motion } from 'framer-motion';
import { useState, useMemo, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { useDarkMode } from './hooks/useDarkMode';
import { useScreenInit } from './useScreenInit';
import { useLanguage } from './context/LanguageContext';
import { localizeMove } from './i18n/localize';
import { Dashboard } from './components/Dashboard';
import { useProfile } from './hooks/useProfile';
import { useUserStats } from './hooks/useUserStats';
import { useWorkoutProgress } from './hooks/useWorkoutProgress';
import { Workout } from './components/Workout';
import { Summary } from './components/Summary';
import { TrainingHub, type HubTab } from './components/TrainingHub';
import { Settings } from './components/Settings';
import {
  LINEUP_EQUIP_COUNT,
  Move,
  Variant,
  getVariantById,
  isRepLoggedCategory,
  isWeightedEquipmentCategory,
  resolveMoveById
} from './components/moves';
import { useEquippedLineup } from './hooks/useEquippedLineup';
import { useDailySetGoal } from './hooks/useDailySetGoal';
import { usePushupDailyReps } from './hooks/usePushupDailyReps';
import { useRotatingProgram } from './hooks/useRotatingProgram';
import { resolveRotatingProgramLineup } from './lib/rotatingProgram';
import { calculateCoinsEarned } from './lib/coinRewards';
import { enqueue, flushOutbox, pendingSetCount, readOutbox, subscribeOutbox } from './lib/outbox';
import { setErrorUser } from './lib/errorTracking';
import { track } from './lib/analytics';
import { storageKeyFor } from './lib/persistedSettings';
import { ReminderPrompt } from './components/ReminderPrompt';
import {
  enableReminders,
  hasAskedForReminders,
  markAskedForReminders,
  reminderPermission,
  reminderSupport,
  type ReminderSupport
} from './lib/notifications';
import { shouldCountStreakForDay, toLocalDateString } from './lib/userStats';
import { useTrainingDaysPerWeek } from './hooks/useTrainingDaysPerWeek';
import { FREE_REST_DAYS_PER_WEEK, useFreeRestDays } from './hooks/useFreeRestDays';
import type { TodayPlan } from './game/engine';
import { persistOwned, readStoredOwned } from './lib/ownedVariants';
import { sumDailySets } from './lib/workoutProgress';
import { RepPrompt } from './components/RepPrompt';
import { WeightRepPrompt } from './components/WeightRepPrompt';
import { recordSetReps } from './lib/repProgress';
import { recordWeightedSetReps } from './lib/weightProgress';
import { resolveSetTargets } from './lib/setPrescription';
import { useWeightUnit } from './hooks/useWeightUnit';
import { useAuth } from './context/AuthContext';
import type { SetRepResult } from './types/repProgress';
import { useOnboarding } from './hooks/useOnboarding';
import { GuidedTour } from './components/GuidedTour';
import { FirstSetCoach, type FirstSetStage } from './components/FirstSetCoach';
import { isPoseAiTrackingEnabled } from './config/features';
import { isPoseExerciseId } from './lib/pose/repCounterFactory';
import { patternForMove, useBaseGame } from './game/useBaseGame';
import { TROPHIES } from './game/catalog';

const DEMO_TOOLS = import.meta.env.VITE_DEMO_TOOLS === 'true';
import { fx, useSoundSetting } from './lib/feedback';
import { BaseScreen } from './components/game/BaseScreen';
import { AppTabBar } from './components/AppTabBar';

type AppState =
  | 'HOME'
  | 'WORKOUT'
  | 'REP_PROMPT'
  | 'WEIGHT_REP_PROMPT'
  | 'SUMMARY'
  | 'STORE'
  | 'SETTINGS'
  | 'BASE';

export function MainApp() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { dailySetGoal, setDailySetGoal } = useDailySetGoal();
  const {
    rotatingProgramEnabled,
    setRotatingProgramEnabled,
    rotatingProgramPhase,
    rotatingProgramCycleDay,
    rotatingProgramTemplate,
    setRotatingProgramTemplate,
    rotationCycle,
    selectProgramCycleDay,
    isRestDayToday: programRestDayToday,
    canTakeRestDay: programCanTakeRestDay,
    restDaysRemainingThisWeek: programRestDaysRemaining,
    markTodayAsRestDay: programMarkRestDay
  } = useRotatingProgram();
  const {
    coins,
    loading: profileLoading,
    error: profileError,
    setCoins,
    refetch: refetchProfile
  } = useProfile();
  const {
    currentStreak,
    longestStreak,
    loading: statsLoading,
    completing: statsCompleting,
    restoringStreak,
    error: statsError,
    lastWorkoutDate,
    recentRestDays,
    restoreStreakCost,
    recordWorkoutComplete,
    restoreStreak: restoreUserStreak,
    refetch: refetchStats,
    totalWorkouts
  } = useUserStats();
  const {
    setsCompleted,
    loading: setsLoading,
    error: setsError,
    incrementSet,
    refetch: refetchProgress
  } = useWorkoutProgress(dailySetGoal);

  useEffect(() => {
    setErrorUser(user?.id ?? null);
  }, [user?.id]);

  // --- Offline outbox: sets saved on this phone sync when signal returns ---
  const pendingSets = useSyncExternalStore(subscribeOutbox, () => pendingSetCount(user?.id), () => 0);
  const syncOutbox = useCallback(async () => {
    if (!user || readOutbox(user.id).length === 0) return;
    const done = await flushOutbox(user.id);
    if (done) {
      void refetchProfile();
      void refetchStats();
      void refetchProgress();
    }
  }, [user, refetchProfile, refetchStats, refetchProgress]);
  useEffect(() => {
    void syncOutbox();
    const onOnline = () => void syncOutbox();
    const onVisible = () => document.visibilityState === 'visible' && void syncOutbox();
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(() => {
      if (user && readOutbox(user.id).length > 0) void syncOutbox();
    }, 20000);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [syncOutbox, user]);
  const {
    pushupRepsToday,
    loading: pushupRepsLoading,
    refetch: refetchPushupReps,
    addReps: addPushupReps
  } = usePushupDailyReps();
  const screenInit = useScreenInit() as {
    appState?: AppState;
    currentMoveId?: string;
    lastDuration?: number;
  };
  const [appState, setAppState] = useState<AppState>(

    screenInit.appState ?? 'HOME'
  );

  // --- Onboarding: "protect your flame" soft ask after the 2nd set on day one ---
  const [reminderAsk, setReminderAsk] = useState<ReminderSupport | null>(null);
  useEffect(() => {
    if (appState !== 'HOME' || !user || reminderAsk) return;
    const today = toLocalDateString();
    const firstDayDone = totalWorkouts === 1 && lastWorkoutDate === today;
    if (!firstDayDone || hasAskedForReminders(user.id)) return;
    const support = reminderSupport();
    if (support === 'unsupported' || (support === 'ok' && reminderPermission() !== 'default')) return;
    setReminderAsk(support);
  }, [appState, user, totalWorkouts, lastWorkoutDate, reminderAsk]);
  const answerReminderAsk = async (allow: boolean) => {
    if (!user) return;
    const support = reminderAsk;
    setReminderAsk(null);
    markAskedForReminders(user.id, support === 'ios-needs-install' ? 'ios' : allow ? 'yes' : 'later');
    track('reminders_prompt_answer', { allow, ios: support === 'ios-needs-install' });
    if (allow && support === 'ok') await enableReminders(user.id, language);
  };

  // --- Onboarding: suggest the program to newcomers who haven't chosen one ---
  const [programTipDismissed, setProgramTipDismissed] = useState(false);
  useEffect(() => {
    try {
      setProgramTipDismissed(!!(user && window.localStorage.getItem(storageKeyFor(user.id, 'program-tip'))));
    } catch {
      setProgramTipDismissed(true);
    }
  }, [user]);
  const showProgramTip = !!user && !programTipDismissed && !rotatingProgramEnabled && totalWorkouts < 3 && !statsLoading;
  useEffect(() => {
    if (showProgramTip && appState === 'HOME') track('program_tip_shown');
  }, [showProgramTip, appState]);
  const closeProgramTip = (accepted: boolean) => {
    if (!user) return;
    setProgramTipDismissed(true);
    try {
      window.localStorage.setItem(storageKeyFor(user.id, 'program-tip'), accepted ? 'accepted' : 'dismissed');
    } catch {
      // Ignore storage failures.
    }
    track(accepted ? 'program_tip_accepted' : 'program_tip_dismissed');
    if (accepted) {
      setRotatingProgramTemplate('ppl3');
      setRotatingProgramEnabled(true);
      fx.confirm();
    }
  };

  const [owned, setOwned] = useState<string[]>(() => readStoredOwned(user?.id));
  const {
    equippedUpper,
    equippedLower,
    equippedCore,
    setEquippedUpper,
    setEquippedLower,
    setEquippedCore
  } = useEquippedLineup(user?.id);
  const { showTutorial, dismissTutorial, replayTutorial } = useOnboarding(user?.id);
  // True from the moment the tour starts the first workout until the user is back home.
  const [guidingFirstSet, setGuidingFirstSet] = useState(false);
  const { weightUnit, setWeightUnit } = useWeightUnit();
  const { trainingDaysPerWeek, setTrainingDaysPerWeek } = useTrainingDaysPerWeek();
  const { soundOn, toggleSound } = useSoundSetting();
  // Training days per week: the program's split, or the player's own setting.
  // The rest of the week is planned rest, which keeps the streak alive.
  const weeklyTarget = rotatingProgramEnabled ? rotationCycle.length : trainingDaysPerWeek;
  // Without the program, the 2 rest-day uses a week are always covered.
  const restAllowance = Math.max(rotatingProgramEnabled ? 0 : FREE_REST_DAYS_PER_WEEK, 7 - weeklyTarget);

  useEffect(() => {
    if (statsLoading || setsLoading) return;
    if (
      shouldCountStreakForDay(sumDailySets(setsCompleted), lastWorkoutDate)
    ) {
      void recordWorkoutComplete(restAllowance);
    }
  }, [
    statsLoading,
    setsLoading,
    setsCompleted,
    lastWorkoutDate,
    recordWorkoutComplete,
    restAllowance
  ]);

  // Rest days: the program's own, or (without the program) up to 2 a week.
  const freeRest = useFreeRestDays(!rotatingProgramEnabled);
  const isRestDayToday = rotatingProgramEnabled ? programRestDayToday : freeRest.isRestDayToday;
  const canTakeRestDay = rotatingProgramEnabled ? programCanTakeRestDay : freeRest.canTakeRestDay;
  const restDaysRemainingThisWeek = rotatingProgramEnabled
    ? programRestDaysRemaining
    : freeRest.restDaysRemainingThisWeek;
  const markTodayAsRestDay = rotatingProgramEnabled ? programMarkRestDay : freeRest.markTodayAsRestDay;

  const lineupForToday = useMemo(() => {
    if (rotatingProgramEnabled && rotatingProgramPhase) {
      return resolveRotatingProgramLineup(rotatingProgramPhase);
    }
    // A rest day without the program: today becomes stretches.
    if (!rotatingProgramEnabled && freeRest.isRestDayToday) {
      return resolveRotatingProgramLineup('recovery');
    }

    return {
      upper: equippedUpper,
      lower: equippedLower,
      core: equippedCore,
      recovery: [] as string[],
      setsToFailure: {} as Record<string, number>
    };
  }, [
    rotatingProgramEnabled,
    rotatingProgramPhase,
    freeRest.isRestDayToday,
    equippedUpper,
    equippedLower,
    equippedCore
  ]);

  // Today's Plan: the exercises and set targets the Train tab shows right now,
  // from the program day or the equipped lineup. The base game reads only this.
  const todayPlan = useMemo<TodayPlan | null>(() => {
    if (setsLoading) return null;
    const ids = [
      ...lineupForToday.upper,
      ...lineupForToday.lower,
      ...lineupForToday.core,
      ...lineupForToday.recovery
    ];
    return {
      day: toLocalDateString(),
      isRestDay: isRestDayToday,
      weeklyTarget,
      exercises: ids.flatMap((id) => {
        const move = resolveMoveById(id);
        if (!move) return [];
        const { totalSets } = resolveSetTargets(
          id,
          1,
          dailySetGoal,
          lineupForToday.setsToFailure,
          rotatingProgramEnabled
        );
        const variant = getVariantById(id);
        return [
          {
            id,
            pattern: patternForMove(move),
            target: totalSets,
            done: setsCompleted[id] ?? 0,
            repCeiling: isRepLoggedCategory(id) ? variant?.repCeiling : undefined
          }
        ];
      })
    };
  }, [
    setsLoading,
    lineupForToday,
    isRestDayToday,
    weeklyTarget,
    dailySetGoal,
    rotatingProgramEnabled,
    setsCompleted
  ]);

  // The base game: every finished set earns materials for it.
  const baseGame = useBaseGame(user?.id, currentStreak, todayPlan);

  const initialMove: Move | null = screenInit.currentMoveId
    ? resolveMoveById(screenInit.currentMoveId)
    : null;
  const [currentMove, setCurrentMove] = useState<Move | null>(initialMove);
  const [lastDuration, setLastDuration] = useState<number>(
    screenInit.lastDuration ?? 0
  );
  const [lastSetResult, setLastSetResult] = useState<SetRepResult | null>(null);
  const [pendingTrackedReps, setPendingTrackedReps] = useState<number | undefined>(
    undefined
  );
  const [summarySetContext, setSummarySetContext] = useState<{
    setNumber: number;
    totalSets: number;
    setsRemaining: number;
  } | null>(null);
  const [weightSaveError, setWeightSaveError] = useState<string | null>(null);
  const finishingRef = useRef(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const displayMove = useMemo(
    () => (currentMove ? localizeMove(currentMove, t.moves) : null),
    [currentMove, t.moves]
  );

  const handleSelectMove = (move: Move) => {
    fx.start();
    finishingRef.current = false;
    setIsFinishing(false);
    setPendingTrackedReps(undefined);
    setCurrentMove(move);
    setAppState('WORKOUT');
  };
  const getWeightedSetContext = (categoryId: string) => {
    const completed = setsCompleted[categoryId] ?? 0;
    const setNumber = completed + 1;
    const { totalSets, rirKey } = resolveSetTargets(
      categoryId,
      setNumber,
      dailySetGoal,
      lineupForToday.setsToFailure,
      rotatingProgramEnabled
    );
    return {
      setNumber,
      totalSets,
      rirKey,
      setsRemaining: Math.max(0, totalSets - setNumber)
    };
  };

  const finishWorkoutSession = (
    duration: number,
    repsLogged?: number,
    options?: { setContext?: typeof summarySetContext; verified?: boolean; weightKg?: number }
  ) => {
    if (!currentMove) return;
    const categoryId = currentMove.categoryId;
    baseGame.recordSet({
      move: currentMove,
      durationSeconds: duration,
      reps: repsLogged,
      verified: options?.verified,
      weightKg: options?.weightKg
    });
    if (categoryId === 'pushups' && repsLogged && repsLogged > 0) {
      addPushupReps(repsLogged);
    }
    void (async () => {
      const totalSetsToday = await incrementSet(categoryId);
      if (
        totalSetsToday !== null &&
        shouldCountStreakForDay(totalSetsToday, lastWorkoutDate)
      ) {
        await recordWorkoutComplete(restAllowance);
      }
    })();
    void setCoins((c) => c + calculateCoinsEarned(duration, currentMove.tier ?? 'BASE'));
    setSummarySetContext(options?.setContext ?? null);
    finishingRef.current = false;
    setIsFinishing(false);
    setAppState('SUMMARY');
  };

  const handleFinishWorkout = async (
    duration: number,
    trackedReps?: number
  ) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    fx.tap();
    setIsFinishing(true);
    setLastDuration(duration);
    setLastSetResult(null);

    if (currentMove && isWeightedEquipmentCategory(currentMove.categoryId)) {
      finishingRef.current = false;
      setIsFinishing(false);
      setPendingTrackedReps(
        trackedReps && trackedReps > 0 ? trackedReps : undefined
      );
      setWeightSaveError(null);
      setAppState('WEIGHT_REP_PROMPT');
      return;
    }

    if (currentMove && isRepLoggedCategory(currentMove.categoryId)) {
      if (trackedReps && trackedReps > 0 && user) {
        try {
          const result = await recordSetReps(
            user.id,
            currentMove.categoryId,
            trackedReps
          );
          setLastSetResult(result);
          // Counted by the camera, so trophies from this set are verified.
          finishWorkoutSession(duration, trackedReps, { verified: true });
          return;
        } catch {
          // No signal: keep the camera-counted set and sync it later.
          enqueue(user.id, { kind: 'reps', categoryId: currentMove.categoryId, reps: trackedReps });
          setLastSetResult(null);
          finishWorkoutSession(duration, trackedReps, { verified: true });
          return;
        }
      }

      finishingRef.current = false;
      setIsFinishing(false);
      setAppState('REP_PROMPT');
      return;
    }

    finishWorkoutSession(duration);
  };

  const handleRepSubmit = async (reps: number) => {
    if (finishingRef.current || !currentMove || !user) return;
    finishingRef.current = true;
    setIsFinishing(true);

    try {
      if (readOutbox(user.id).some((item) => item.kind === 'reps' || item.kind === 'weighted')) throw new Error('queued');
      const result = await recordSetReps(user.id, currentMove.categoryId, reps);
      setLastSetResult(result);
      finishWorkoutSession(lastDuration, reps);
    } catch {
      // No signal: never lose the set. Save it on this phone and sync later.
      enqueue(user.id, { kind: 'reps', categoryId: currentMove.categoryId, reps });
      setLastSetResult(null);
      finishWorkoutSession(lastDuration, reps);
    }
  };
  const handleWeightRepSubmit = async (weightKg: number, reps: number) => {
    if (finishingRef.current || !currentMove || !user) return;
    finishingRef.current = true;
    setIsFinishing(true);
    setWeightSaveError(null);

    const setContext = getWeightedSetContext(currentMove.categoryId);
    const isLastSet = setContext.setNumber >= setContext.totalSets;

    try {
      const result = await recordWeightedSetReps(
        user.id,
        currentMove.categoryId,
        weightKg,
        reps,
        setContext.setNumber,
        setContext.totalSets,
        weightUnit
      );
      setLastSetResult(result);
      finishWorkoutSession(lastDuration, reps, {
        weightKg,
        setContext: {
          setNumber: setContext.setNumber,
          totalSets: setContext.totalSets,
          setsRemaining: isLastSet ? 0 : setContext.setsRemaining
        }
      });
    } catch {
      // No signal: keep the set (weight and reps) and sync it later.
      enqueue(user.id, {
        kind: 'weighted',
        categoryId: currentMove.categoryId,
        weightKg,
        reps,
        setNumber: setContext.setNumber,
        totalSets: setContext.totalSets,
        unit: weightUnit
      });
      setLastSetResult(null);
      finishWorkoutSession(lastDuration, reps, {
        weightKg,
        setContext: {
          setNumber: setContext.setNumber,
          totalSets: setContext.totalSets,
          setsRemaining: isLastSet ? 0 : setContext.setsRemaining
        }
      });
    }
  };
  const handleCancelWorkout = () => {
    setGuidingFirstSet(false);
    finishingRef.current = false;
    setIsFinishing(false);
    setPendingTrackedReps(undefined);
    setSummarySetContext(null);
    setCurrentMove(null);
    setAppState('HOME');
  };
  const handleGoHome = () => {
    setGuidingFirstSet(false);
    finishingRef.current = false;
    setIsFinishing(false);
    setCurrentMove(null);
    setLastDuration(0);
    setLastSetResult(null);
    setPendingTrackedReps(undefined);
    setSummarySetContext(null);
    void refetchPushupReps();
    setAppState('HOME');
  };
  // Lodge shield: a free restore for an unplanned miss.
  const handleUseShield = async () => {
    if (!user || restoringStreak || baseGame.state.shields < 1) return;
    const result = await restoreUserStreak({ free: true });
    if (result) {
      baseGame.spendShield();
      fx.success();
    }
  };
  const handleRestoreStreak = async () => {
    if (!user || restoringStreak || coins < restoreStreakCost) return;

    const result = await restoreUserStreak();
    if (result) fx.success();
    if (result?.cost) {
      void setCoins((current) => Math.max(0, current - result.cost));
    }
  };

  const [hubTab, setHubTab] = useState<HubTab>('plan');
  // Demo build only: one-tap cheats for testing the base and the shop.
  const demoTools = {
    addCoins: () => void setCoins((c) => c + 10000),
    addMaterials: () =>
      baseGame.devPatch((st) => ({
        ...st,
        resources: { stone: st.resources.stone + 5000, timber: st.resources.timber + 5000, crystal: st.resources.crystal + 5000 }
      })),
    finishBuilds: () =>
      baseGame.devPatch((st) => ({
        ...st,
        placed: st.placed.map((p) => {
          const job = st.constructions.find((j) => j.uid === p.uid);
          return job ? { ...p, level: job.targetLevel } : p;
        }),
        constructions: []
      })),
    unlockAll: () =>
      baseGame.devPatch((st) => ({
        ...st,
        trophies: Object.fromEntries(
          TROPHIES.map((tr) => [tr.id, st.trophies[tr.id] ?? { earnedAt: new Date().toISOString(), value: 100 }])
        ),
        stats: { ...st.stats, weeksOnTarget: Math.max(st.stats.weeksOnTarget, 20), weeklyStreak: Math.max(st.stats.weeklyStreak, 12) }
      }))
  };

  const handleOpenPlan = () => {
    fx.tick();
    setHubTab('plan');
    setAppState('STORE');
  };
  const handleCloseStore = () => setAppState('HOME');
  const handleTab = (tab: 'train' | 'base' | 'settings') => {
    if (tab === 'base') fx.baseTab();
    else if (tab === 'settings') fx.tick();
    else fx.trainTab();
    setAppState(tab === 'base' ? 'BASE' : tab === 'settings' ? 'SETTINGS' : 'HOME');
    window.scrollTo({ top: 0 });
  };
  const handleSeeBase = () => {
    handleGoHome();
    setAppState('BASE');
    window.scrollTo({ top: 0 });
  };
  const handleReplayTour = () => {
    setAppState('HOME');
    window.scrollTo({ top: 0 });
    replayTutorial();
  };
  const handleTourClose = (started: boolean) => {
    dismissTutorial();
    if (started) setGuidingFirstSet(true);
  };
  const handleBuy = (_categoryId: string, variant: Variant) => {
    if (coins < variant.price || owned.includes(variant.id)) {
      fx.error();
      return;
    }
    fx.coin();
    void setCoins((c) => c - variant.price);
    setOwned((o) => {
      const next = [...o, variant.id];
      persistOwned(next, user?.id);
      return next;
    });
  };

  /**
   * Put `toId` in the lineup in place of `fromId` (same category). If `toId`
   * is already in the lineup, the two swap places instead.
   */
  const handleSwapLineup = (category: 'upper' | 'lower' | 'core', fromId: string | null, toId: string) => {
    if (rotatingProgramEnabled || !owned.includes(toId)) return;
    const [list, setList] =
      category === 'upper'
        ? [equippedUpper, setEquippedUpper]
        : category === 'lower'
          ? [equippedLower, setEquippedLower]
          : [equippedCore, setEquippedCore];
    if (fromId === toId) return;
    let next: string[];
    if (list.includes(toId)) {
      if (!fromId || !list.includes(fromId)) return;
      next = list.map((id) => (id === fromId ? toId : id === toId ? fromId : id));
    } else if (fromId && list.includes(fromId)) {
      next = list.map((id) => (id === fromId ? toId : id));
    } else if (list.length < LINEUP_EQUIP_COUNT) {
      next = [...list, toId];
    } else {
      return;
    }
    setList(next);
  };

  const firstSetStage: FirstSetStage | null = (() => {
    if (!guidingFirstSet || !currentMove) return null;
    if (appState === 'WORKOUT') {
      // The AI camera screen has its own positioning guidance.
      const usesCamera =
        isPoseAiTrackingEnabled() && isPoseExerciseId(currentMove.categoryId);
      return usesCamera ? null : 'workout';
    }
    if (appState === 'REP_PROMPT') return 'repPrompt';
    if (appState === 'WEIGHT_REP_PROMPT') return 'weightPrompt';
    if (appState === 'SUMMARY') return 'summary';
    return null;
  })();

  const weightRepContext =
    currentMove && appState === 'WEIGHT_REP_PROMPT'
      ? getWeightedSetContext(currentMove.categoryId)
      : null;

  const showTabBar = appState === 'HOME' || appState === 'BASE' || appState === 'SETTINGS';

  return (
    <div
      className={`min-h-screen w-full bg-[#f4f4f0] dark:bg-[#1a1a1a] text-black dark:text-[#f4f4f0] selection:bg-[#BEF028] selection:text-black ${
        showTabBar ? 'has-tab-bar' : ''
      }`}>
      {reminderAsk && appState === 'HOME' && (
        <ReminderPrompt support={reminderAsk} onAllow={() => void answerReminderAsk(true)} onLater={() => void answerReminderAsk(false)} />
      )}

      {pendingSets > 0 && (appState === 'HOME' || appState === 'BASE' || appState === 'SUMMARY') && (
        <div className="offline-notice" role="status">
          <span aria-hidden="true">📶</span>
          <span className="offline-notice-text">{t.hub.offline.pending(pendingSets)}</span>
          <button type="button" className="offline-notice-btn" onClick={() => void syncOutbox()}>
            {t.hub.offline.retry}
          </button>
        </div>
      )}

      {/* Screens fade in. Opacity only: a transform would break fixed-position screens. */}
      <motion.div
        key={appState}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}>
      {appState === 'HOME' &&
      <Dashboard
        coins={coins}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        statsLoading={statsLoading}
        statsCompleting={statsCompleting}
        restoringStreak={restoringStreak}
        lastWorkoutDate={lastWorkoutDate}
        restoreStreakCost={restoreStreakCost}
        onRestoreStreak={handleRestoreStreak}
        materials={baseGame.state.resources}
        restAllowance={restAllowance}
        recentRestDays={recentRestDays}
        shields={baseGame.state.shields}
        onUseShield={handleUseShield}
        profileLoading={profileLoading}
        profileError={profileError}
        statsError={statsError}
        setsError={setsError}
        setsLoading={setsLoading}
        equippedUpper={lineupForToday.upper}
        equippedLower={lineupForToday.lower}
        equippedCore={lineupForToday.core}
        equippedRecovery={lineupForToday.recovery}
        setsCompleted={setsCompleted}
        dailySetGoal={dailySetGoal}
        programSetsToFailure={lineupForToday.setsToFailure}
        rotatingProgramEnabled={rotatingProgramEnabled}
        rotatingProgramPhase={rotatingProgramPhase}
        rotatingProgramCycleDay={rotatingProgramCycleDay}
        rotationCycleLength={rotationCycle.length}
        isRestDayToday={isRestDayToday}
        canTakeRestDay={canTakeRestDay}
        restDaysRemainingThisWeek={restDaysRemainingThisWeek}
        onTakeRestDay={() => {
          fx.rest();
          markTodayAsRestDay();
        }}
        pushupRepsToday={pushupRepsToday}
        pushupRepsLoading={pushupRepsLoading}
        onSelectMove={handleSelectMove}
        onOpenPlan={handleOpenPlan}
        trainingDaysPerWeek={trainingDaysPerWeek}
        tip={
          showProgramTip ? (
            <section className="program-tip mb-4 normal-case" aria-labelledby="program-tip-title">
              <h2 id="program-tip-title" className="program-tip-title">
                {t.hub.programTip.title}
              </h2>
              <p className="program-tip-sub">{t.hub.programTip.sub}</p>
              <div className="program-tip-actions">
                <button type="button" className="program-tip-btn is-primary" onClick={() => closeProgramTip(true)}>
                  {t.hub.programTip.tryIt}
                </button>
                <button type="button" className="program-tip-btn" onClick={() => closeProgramTip(false)}>
                  {t.hub.programTip.dismiss}
                </button>
              </div>
            </section>
          ) : undefined
        }
 />

      }

      {appState === 'STORE' &&
      <TrainingHub
        tab={hubTab}
        onTabChange={setHubTab}
        onBack={handleCloseStore}
        coins={coins}
        owned={owned}
        equippedUpper={equippedUpper}
        equippedLower={equippedLower}
        equippedCore={equippedCore}
        programLineup={{ upper: lineupForToday.upper, lower: lineupForToday.lower, core: lineupForToday.core }}
        onBuy={(variant) => handleBuy(variant.id, variant)}
        onSwap={handleSwapLineup}
        rotatingProgramEnabled={rotatingProgramEnabled}
        onRotatingProgramEnabledChange={setRotatingProgramEnabled}
        rotatingProgramTemplate={rotatingProgramTemplate}
        onSelectProgramTemplate={setRotatingProgramTemplate}
        rotationCycle={rotationCycle}
        rotatingProgramCycleDay={rotatingProgramCycleDay}
        rotatingProgramPhase={rotatingProgramPhase}
        onSelectProgramCycleDay={selectProgramCycleDay}
        isRestDayToday={isRestDayToday}
        isDark={isDark}
        dailySetGoal={dailySetGoal}
        onDailySetGoalChange={setDailySetGoal}
        trainingDaysPerWeek={trainingDaysPerWeek}
        onTrainingDaysChange={setTrainingDaysPerWeek} />

      }

      {appState === 'SETTINGS' &&
      <Settings
        coins={coins}
        isDark={isDark}
        onToggleDark={toggleDark}
        weightUnit={weightUnit}
        onWeightUnitChange={setWeightUnit}
        onReplayTour={handleReplayTour}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        onOpenPlan={handleOpenPlan}
        demoTools={DEMO_TOOLS ? demoTools : undefined} />

      }

      {appState === 'WORKOUT' && displayMove &&
      <Workout
        move={displayMove}
        finishing={isFinishing}
        onFinish={(duration, trackedReps) =>
          void handleFinishWorkout(duration, trackedReps)
        }
        onCancel={handleCancelWorkout} />

      }

      {appState === 'REP_PROMPT' && displayMove &&
      <RepPrompt
        move={displayMove}
        submitting={isFinishing}
        onSubmit={(reps) => void handleRepSubmit(reps)} />

      }

      {appState === 'WEIGHT_REP_PROMPT' && displayMove && weightRepContext &&
      <WeightRepPrompt
        move={displayMove}
        setNumber={weightRepContext.setNumber}
        totalSets={weightRepContext.totalSets}
        rirKey={weightRepContext.rirKey}
        weightUnit={weightUnit}
        submitting={isFinishing}
        saveError={weightSaveError}
        initialReps={pendingTrackedReps}
        onSubmit={(weightKg, reps) => void handleWeightRepSubmit(weightKg, reps)} />

      }

      {appState === 'SUMMARY' && displayMove &&
      <Summary
        move={displayMove}
        duration={lastDuration}
        setResult={lastSetResult}
        weightUnit={weightUnit}
        setNumber={summarySetContext?.setNumber}
        totalSets={summarySetContext?.totalSets}
        setsRemaining={summarySetContext?.setsRemaining ?? 0}
        baseReward={baseGame.lastReward}
        onSeeBase={handleSeeBase}
        onHome={handleGoHome}
        baseState={baseGame.state}
        basePlan={baseGame.plan}
        firstBase={!baseGame.state.introSeen} />

      }

      {appState === 'BASE' && (
        <BaseScreen
          game={baseGame}
          coins={coins}
          onSpendCoins={(amount) => void setCoins((current) => Math.max(0, current - amount))}
        />
      )}
      </motion.div>

      {showTabBar && (
        <AppTabBar
          active={appState === 'BASE' ? 'base' : appState === 'SETTINGS' ? 'settings' : 'train'}
          onChange={handleTab}
          baseHasNews={baseGame.hasNews}
        />
      )}

      {showTutorial && appState === 'HOME' && <GuidedTour onClose={handleTourClose} />}

      {firstSetStage && <FirstSetCoach stage={firstSetStage} />}
    </div>
  );
}
