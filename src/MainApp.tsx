import { motion } from 'framer-motion';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
import { Settings } from './components/Settings';
import {
  Move,
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
import { localizeVariant } from './i18n/localize';
import { DAYS_FOR_TEMPLATE, TEMPLATE_FOR_DAYS, lineupFromPlan, planForPhase, slotProgress } from './lib/plan';
import { addSlotHint, readSlotHints } from './lib/slotHints';
import { supabase } from './lib/supabase';
import { REST, restSecondsFor } from './lib/restTimes';
import { RestTimerBanner, type RestTimer } from './components/RestTimerBanner';
import { ProgressScreen } from './components/ProgressScreen';
import { usePlan } from './hooks/usePlan';
import { PlanScreen } from './components/PlanScreen';
import { calculateCoinsEarned } from './lib/coinRewards';
import { shouldCountStreakForDay, toLocalDateString } from './lib/userStats';
import { useTrainingDaysPerWeek } from './hooks/useTrainingDaysPerWeek';
import { FREE_REST_DAYS_PER_WEEK, useFreeRestDays } from './hooks/useFreeRestDays';
import type { TodayPlan } from './game/engine';
import { sumDailySets } from './lib/workoutProgress';
import { RepPrompt } from './components/RepPrompt';
import { WeightRepPrompt } from './components/WeightRepPrompt';
import { provisionalResult, saveSetInBackground, savePendingSets, type SetSaveJob } from './lib/backgroundSetSave';
import { resolveSetTargets } from './lib/setPrescription';
import { useWeightUnit } from './hooks/useWeightUnit';
import { useAuth } from './context/AuthContext';
import type { SetRepResult } from './types/repProgress';
import { useOnboarding } from './hooks/useOnboarding';
import { GuidedTour } from './components/GuidedTour';
import { QuestOnboarding, readQuestStage } from './components/QuestOnboarding';
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
  | 'PROGRESS'
  | 'BASE';

export function MainApp() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { dailySetGoal } = useDailySetGoal();
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
    earnForSet,
    spend
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
    restoreStreak: restoreUserStreak
  } = useUserStats();
  const {
    setsCompleted,
    loading: setsLoading,
    error: setsError,
    incrementSet
  } = useWorkoutProgress(dailySetGoal);
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
  const {
    equippedUpper,
    equippedLower,
    equippedCore
  } = useEquippedLineup(user?.id);
  const { showTutorial, dismissTutorial, replayTutorial } = useOnboarding(user?.id);
  // True from the moment the tour starts the first workout until the user is back home.
  const [guidingFirstSet, setGuidingFirstSet] = useState(false);
  const { weightUnit, setWeightUnit } = useWeightUnit();
  const { trainingDaysPerWeek } = useTrainingDaysPerWeek();
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

  const plan = usePlan();
  // One way to train: everyone follows Your plan (the rotating day types).
  useEffect(() => {
    if (!rotatingProgramEnabled) setRotatingProgramEnabled(true);
  }, [rotatingProgramEnabled, setRotatingProgramEnabled]);

  const lineupForToday = useMemo(() => {
    if (rotatingProgramEnabled && rotatingProgramPhase) {
      // Your plan: today's day type, filled from the player's equipment and levels.
      return rotatingProgramPhase === 'recovery'
        ? resolveRotatingProgramLineup('recovery')
        : lineupFromPlan(planForPhase(rotatingProgramPhase, plan.gear, plan.levels));
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
    plan.gear,
    plan.levels,
    equippedUpper,
    equippedLower,
    equippedCore
  ]);

  // Today's slots (when following the plan), and each slot's completed sets:
  // progress belongs to the slot, so switching an exercise keeps it.
  const plannedToday = useMemo(
    () =>
      rotatingProgramEnabled && rotatingProgramPhase && rotatingProgramPhase !== 'recovery'
        ? planForPhase(rotatingProgramPhase, plan.gear, plan.levels)
        : null,
    [rotatingProgramEnabled, rotatingProgramPhase, plan.gear, plan.levels]
  );
  const [slotHintsVersion, setSlotHintsVersion] = useState(0);
  const slotDone = useMemo(() => {
    if (!plannedToday) return null;
    const bySlot = slotProgress(plannedToday, setsCompleted, readSlotHints(user?.id));
    return Object.fromEntries(plannedToday.map((p) => [p.exerciseId, bySlot[p.slot.key] ?? 0])) as Record<string, number>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannedToday, setsCompleted, user?.id, slotHintsVersion]);
  const doneToday = useCallback((id: string) => slotDone?.[id] ?? setsCompleted[id] ?? 0, [slotDone, setsCompleted]);

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
            done: doneToday(id),
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
    doneToday
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
  const [workoutDone, setWorkoutDone] = useState(false);

  // Rest timer between sets (remembered across screens and reloads).
  const restKey = user?.id ? `2failure-user-${user.id}-rest-timer` : null;
  const [restTimer, setRestTimerState] = useState<RestTimer | null>(() => {
    try {
      const saved = restKey ? (JSON.parse(window.localStorage.getItem(restKey) ?? 'null') as RestTimer | null) : null;
      return saved && saved.endsAt > Date.now() - 10 * 60 * 1000 ? saved : null;
    } catch {
      return null;
    }
  });
  const setRestTimer = useCallback(
    (next: RestTimer | null) => {
      setRestTimerState(next);
      try {
        if (!restKey) return;
        if (next) window.localStorage.setItem(restKey, JSON.stringify(next));
        else window.localStorage.removeItem(restKey);
      } catch {
        // Storage blocked: the timer still runs for this session.
      }
    },
    [restKey]
  );
  const finishingRef = useRef(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const displayMove = useMemo(
    () => (currentMove ? localizeMove(currentMove, t.moves) : null),
    [currentMove, t.moves]
  );

  const handleSelectMove = (move: Move) => {
    setRestTimer(null);
    fx.start();
    finishingRef.current = false;
    setIsFinishing(false);
    setPendingTrackedReps(undefined);
    setCurrentMove(move);
    setAppState('WORKOUT');
  };
  const getWeightedSetContext = (categoryId: string) => {
    const completed = doneToday(categoryId);
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
    // Remember which slot this set was for (keeps progress through exercise switches).
    const slotForSet = plannedToday?.find((p) => p.exerciseId === categoryId)?.slot.key;
    if (slotForSet) {
      addSlotHint(user?.id, categoryId, slotForSet);
      setSlotHintsVersion((v) => v + 1);
    }
    // Was this the last set of today's whole plan? Then the receipt says "Workout done!".
    const dayDone =
      !!todayPlan &&
      !todayPlan.isRestDay &&
      todayPlan.exercises.length > 0 &&
      todayPlan.exercises.every((e) => (e.id === categoryId ? e.done + 1 : e.done) >= e.target);
    setWorkoutDone(dayDone);
    // Rest before the next set: this exercise's rest if more sets remain,
    // a short transition if the next set is a different exercise.
    {
      const here = todayPlan?.exercises.find((e) => e.id === categoryId);
      const moreHere = !here || here.done + 1 < here.target;
      const nextUp = moreHere ? categoryId : todayPlan?.exercises.find((e) => e.id !== categoryId && e.done < e.target)?.id;
      const seconds = dayDone || !nextUp ? 0 : moreHere ? restSecondsFor(categoryId) : REST.nextExercise;
      const nextMove = nextUp ? resolveMoveById(nextUp) : null;
      setRestTimer(
        seconds > 0 && nextUp && nextMove
          ? { endsAt: Date.now() + seconds * 1000, total: seconds, nextId: nextUp, nextName: nextMove.name, nextExercise: !moreHere }
          : null
      );
    }
    // The server decides the reward (and checks the set is plausible). It also
    // records the set, which the streak guard looks for, so the streak waits for it.
    const reward = earnForSet(currentMove.id, duration, currentMove.tier ?? 'BASE', calculateCoinsEarned(duration, currentMove.tier ?? 'BASE'));
    void (async () => {
      const totalSetsToday = await incrementSet(categoryId);
      if (
        totalSetsToday !== null &&
        shouldCountStreakForDay(totalSetsToday, lastWorkoutDate)
      ) {
        await reward.catch(() => undefined);
        await recordWorkoutComplete(restAllowance);
      }
    })();
    setSummarySetContext(options?.setContext ?? null);
    finishingRef.current = false;
    setIsFinishing(false);
    setAppState('SUMMARY');
  };

  // Show the receipt right away; save the set in the background and swap in
  // the confirmed result (personal bests, weight suggestion) when it arrives.
  const saveTokenRef = useRef(0);
  const showAndSave = (job: SetSaveJob) => {
    if (!user) return;
    const token = ++saveTokenRef.current;
    setLastSetResult(provisionalResult(user.id, job));
    void saveSetInBackground(user.id, job).then((result) => {
      if (result && saveTokenRef.current === token) setLastSetResult(result);
    });
  };
  useEffect(() => {
    if (user) void savePendingSets(user.id);
  }, [user]);

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
        showAndSave({ kind: 'reps', categoryId: currentMove.categoryId, reps: trackedReps });
        // Counted by the camera, so trophies from this set are verified.
        finishWorkoutSession(duration, trackedReps, { verified: true });
        return;
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

    showAndSave({ kind: 'reps', categoryId: currentMove.categoryId, reps });
    finishWorkoutSession(lastDuration, reps);
  };
  const handleWeightRepSubmit = async (weightKg: number, reps: number) => {
    if (finishingRef.current || !currentMove || !user) return;
    finishingRef.current = true;
    setIsFinishing(true);
    setWeightSaveError(null);

    const setContext = getWeightedSetContext(currentMove.categoryId);
    const isLastSet = setContext.setNumber >= setContext.totalSets;

    showAndSave({
      kind: 'weighted',
      categoryId: currentMove.categoryId,
      weightKg,
      reps,
      setNumber: setContext.setNumber,
      totalSets: setContext.totalSets,
      unit: weightUnit
    });
    finishWorkoutSession(lastDuration, reps, {
      weightKg,
      setContext: {
        setNumber: setContext.setNumber,
        totalSets: setContext.totalSets,
        setsRemaining: isLastSet ? 0 : setContext.setsRemaining
      }
    });
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
      void spend(result.cost, 'streak_restore');
    }
  };

  // Demo build only: one-tap cheats for testing the base and the shop.
  const demoTools = {
    addCoins: () => void setCoins((c) => c + 10000),
    // (demo only) the demo server also enforces the material budget, so raise it with the materials
    addMaterials: () => {
      void supabase.rpc('demo_add_budget', { p_amount: 20000 });
      baseGame.devPatch((st) => ({
        ...st,
        resources: { stone: st.resources.stone + 5000, timber: st.resources.timber + 5000, crystal: st.resources.crystal + 5000 }
      }));
    },
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
    setAppState('STORE');
  };
  const handleCloseStore = () => setAppState('HOME');
  const handleTab = (tab: 'train' | 'progress' | 'base' | 'settings') => {
    if (tab === 'base') fx.baseTab();
    else if (tab === 'settings' || tab === 'progress') fx.tick();
    else fx.trainTab();
    setAppState(tab === 'base' ? 'BASE' : tab === 'settings' ? 'SETTINGS' : tab === 'progress' ? 'PROGRESS' : 'HOME');
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
  // Onboarding quest for brand-new players: build the free Lodge, then finish
  // it with the first set to failure. Replays use the classic home tour.
  const questStage = user ? readQuestStage(user.id) : 'done';
  const questActive =
    showTutorial &&
    !!user &&
    questStage !== 'done' &&
    (questStage !== 'welcome' || (baseGame.state.firstBuildFree === true && !baseGame.state.placed.some((p) => p.itemId === 'lodge')));
  const firstExerciseName = (() => {
    const id = lineupForToday.upper[0] ?? lineupForToday.lower[0] ?? lineupForToday.core[0];
    const variant = id ? getVariantById(id) : undefined;
    return variant ? localizeVariant(variant, t.moves).name : '';
  })();

  const handleTourClose = (started: boolean) => {
    dismissTutorial();
    if (started) setGuidingFirstSet(true);
  };
  // Your plan: once a set shows the player has outgrown this exercise, the
  // receipt offers the next harder one for the same slot.
  const harderForCurrentMove = (() => {
    if (!currentMove || !rotatingProgramPhase || rotatingProgramPhase === 'recovery') return null;
    const slot = planForPhase(rotatingProgramPhase, plan.gear, plan.levels).find((p) => p.exerciseId === currentMove.id);
    if (!slot?.harder) return null;
    const next = getVariantById(slot.harder);
    if (!next) return null;
    const harderId = slot.harder;
    return {
      name: localizeVariant(next, t.moves).name,
      onApply: () => plan.setLevel(slot.slot.key, harderId)
    };
  })();

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

  const showTabBar = appState === 'HOME' || appState === 'BASE' || appState === 'SETTINGS' || appState === 'PROGRESS';


  // While resting, the page moves down so the banner never covers anything.
  const showRestBanner = !!restTimer && appState !== 'WORKOUT' && appState !== 'REP_PROMPT' && appState !== 'WEIGHT_REP_PROMPT';

  return (
    <div
      className={`min-h-screen w-full bg-[#f4f4f0] dark:bg-[#1a1a1a] text-black dark:text-[#f4f4f0] selection:bg-[#BEF028] selection:text-black ${
        showTabBar ? 'has-tab-bar' : ''
      } ${showRestBanner ? 'has-rest-banner' : ''}`}>
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
        slotDone={slotDone}
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
 />

      }

      {appState === 'STORE' && (
        <PlanScreen
          onBack={handleCloseStore}
          days={DAYS_FOR_TEMPLATE[rotatingProgramTemplate] ?? 5}
          onDays={(n) => setRotatingProgramTemplate(TEMPLATE_FOR_DAYS[n])}
          rotation={rotationCycle}
          cycleDay={rotatingProgramCycleDay}
          isRestDayToday={isRestDayToday}
          gear={plan.gear}
          onToggleGear={plan.toggleGear}
          levels={plan.levels}
          onSetLevel={plan.setLevel}
          onSelectDay={selectProgramCycleDay}
        />
      )}

      {appState === 'PROGRESS' && user && (
        <ProgressScreen
          userId={user.id}
          streak={currentStreak}
          restDays={recentRestDays}
          refreshKey={Object.values(setsCompleted).reduce((a, b) => a + b, 0)}
        />
      )}
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
        workoutDone={workoutDone}
        baseReward={baseGame.lastReward}
        harder={harderForCurrentMove}
        onSeeBase={handleSeeBase}
        onHome={handleGoHome} />

      }

      {appState === 'BASE' && (
        <BaseScreen
          game={baseGame}
          coins={coins}
          onSpendCoins={(amount) => void spend(amount, 'base')}
        />
      )}
      </motion.div>

      {showRestBanner && restTimer && (
        <RestTimerBanner
          timer={restTimer}
          onAdjust={(sec) =>
            setRestTimer({ ...restTimer, endsAt: Math.max(Date.now(), restTimer.endsAt + sec * 1000), total: Math.max(15, restTimer.total + sec) })
          }
          onDismiss={() => setRestTimer(null)}
          onStart={() => {
            const move = resolveMoveById(restTimer.nextId);
            if (move) handleSelectMove(move);
            else setRestTimer(null);
          }}
        />
      )}

      {showTabBar && (
        <AppTabBar
          active={appState === 'BASE' ? 'base' : appState === 'SETTINGS' ? 'settings' : appState === 'PROGRESS' ? 'progress' : 'train'}
          onChange={handleTab}
          baseHasNews={baseGame.hasNews}
        />
      )}

      {questActive && user ? (
        <QuestOnboarding
          userId={user.id}
          appState={appState}
          hasConstruction={baseGame.state.constructions.length > 0}
          firstExerciseName={firstExerciseName}
          onGoBase={() => {
            baseGame.dismissIntro();
            setAppState('BASE');
          }}
          onStartFirstSet={() => setGuidingFirstSet(true)}
          onDone={dismissTutorial}
        />
      ) : (
        showTutorial && appState === 'HOME' && <GuidedTour onClose={handleTourClose} />
      )}

      {firstSetStage && <FirstSetCoach stage={firstSetStage} />}
    </div>
  );
}
