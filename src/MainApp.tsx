import { useState, useMemo, useRef, useEffect } from 'react';
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
import { Store } from './components/Store';
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
  const { t } = useLanguage();
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
    setCoins
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
  const [owned, setOwned] = useState<string[]>(() => readStoredOwned(user?.id));
  const {
    equippedUpper,
    equippedLower,
    equippedCore,
    setEquippedUpper,
    toggleEquipUpper,
    toggleEquipLower,
    toggleEquipCore
  } = useEquippedLineup(user?.id);
  const { showTutorial, dismissTutorial, replayTutorial } = useOnboarding(user?.id);
  // True from the moment the tour starts the first workout until the user is back home.
  const [guidingFirstSet, setGuidingFirstSet] = useState(false);
  const { weightUnit, setWeightUnit } = useWeightUnit();
  const { trainingDaysPerWeek, setTrainingDaysPerWeek } = useTrainingDaysPerWeek();
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
    options?: { setContext?: typeof summarySetContext; verified?: boolean }
  ) => {
    if (!currentMove) return;
    const categoryId = currentMove.categoryId;
    baseGame.recordSet({
      move: currentMove,
      durationSeconds: duration,
      reps: repsLogged,
      verified: options?.verified
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
          // Fall back to manual rep entry if auto-save fails.
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
      const result = await recordSetReps(user.id, currentMove.categoryId, reps);
      setLastSetResult(result);
      finishWorkoutSession(lastDuration, reps);
    } catch {
      finishingRef.current = false;
      setIsFinishing(false);
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
        setContext: {
          setNumber: setContext.setNumber,
          totalSets: setContext.totalSets,
          setsRemaining: isLastSet ? 0 : setContext.setsRemaining
        }
      });
    } catch (err) {
      finishingRef.current = false;
      setIsFinishing(false);
      setWeightSaveError(
        err instanceof Error ? err.message : t.workout.weightPrompt.saveError
      );
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
    if (result) baseGame.spendShield();
  };
  const handleRestoreStreak = async () => {
    if (!user || restoringStreak || coins < restoreStreakCost) return;

    const result = await restoreUserStreak();
    if (result?.cost) {
      void setCoins((current) => Math.max(0, current - result.cost));
    }
  };

  const handleOpenStore = () => setAppState('STORE');
  const handleCloseStore = () => setAppState('HOME');
  const handleOpenSettings = () => setAppState('SETTINGS');
  const handleCloseSettings = () => setAppState('HOME');
  const handleTab = (tab: 'train' | 'base') => {
    setAppState(tab === 'base' ? 'BASE' : 'HOME');
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
    if (coins < variant.price || owned.includes(variant.id)) return;
    void setCoins((c) => c - variant.price);
    setOwned((o) => {
      const next = [...o, variant.id];
      persistOwned(next, user?.id);
      return next;
    });
  };

  const handleToggleEquipUpper = (exerciseId: string) => {
    if (rotatingProgramEnabled || !owned.includes(exerciseId)) return;

    if (equippedUpper.includes(exerciseId)) {
      toggleEquipUpper(exerciseId);
      return;
    }

    if (equippedUpper.length >= LINEUP_EQUIP_COUNT) {
      const nextUpper = [...equippedUpper];
      nextUpper.splice(0, 1, exerciseId);
      setEquippedUpper(nextUpper);
      return;
    }

    toggleEquipUpper(exerciseId);
  };

  const handleToggleEquipLower = (exerciseId: string) => {
    if (rotatingProgramEnabled || !owned.includes(exerciseId)) return;
    toggleEquipLower(exerciseId);
  };

  const handleToggleEquipCore = (exerciseId: string) => {
    if (rotatingProgramEnabled || !owned.includes(exerciseId)) return;
    toggleEquipCore(exerciseId);
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

  const showTabBar = appState === 'HOME' || appState === 'BASE';

  return (
    <div
      className={`min-h-screen w-full bg-[#f4f4f0] dark:bg-[#1a1a1a] text-black dark:text-[#f4f4f0] selection:bg-[#BEF028] selection:text-black ${
        showTabBar ? 'has-tab-bar' : ''
      }`}>
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
        onTakeRestDay={markTodayAsRestDay}
        pushupRepsToday={pushupRepsToday}
        pushupRepsLoading={pushupRepsLoading}
        onSelectMove={handleSelectMove}
        onOpenStore={handleOpenStore}
        onOpenSettings={handleOpenSettings} />

      }

      {appState === 'STORE' &&
      <Store
        coins={coins}
        owned={owned}
        equippedUpper={equippedUpper}
        equippedLower={equippedLower}
        equippedCore={equippedCore}
        onBack={handleCloseStore}
        onBuy={handleBuy}
        onToggleEquipUpper={handleToggleEquipUpper}
        onToggleEquipLower={handleToggleEquipLower}
        onToggleEquipCore={handleToggleEquipCore}
        rotatingProgramEnabled={rotatingProgramEnabled} />

      }

      {appState === 'SETTINGS' &&
      <Settings
        coins={coins}
        dailySetGoal={dailySetGoal}
        rotatingProgramEnabled={rotatingProgramEnabled}
        rotatingProgramPhase={rotatingProgramPhase}
        rotatingProgramCycleDay={rotatingProgramCycleDay}
        rotatingProgramTemplate={rotatingProgramTemplate}
        onSelectProgramTemplate={setRotatingProgramTemplate}
        rotationCycle={rotationCycle}
        isRestDayToday={isRestDayToday}
        onSelectProgramCycleDay={selectProgramCycleDay}
        isDark={isDark}
        onDailySetGoalChange={setDailySetGoal}
        onRotatingProgramEnabledChange={setRotatingProgramEnabled}
        onToggleDark={toggleDark}
        weightUnit={weightUnit}
        onWeightUnitChange={setWeightUnit}
        onReplayTour={handleReplayTour}
        trainingDaysPerWeek={trainingDaysPerWeek}
        onTrainingDaysChange={setTrainingDaysPerWeek}
        onBack={handleCloseSettings} />

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
        onHome={handleGoHome} />

      }

      {appState === 'BASE' && (
        <BaseScreen
          game={baseGame}
          coins={coins}
          onSpendCoins={(amount) => void setCoins((current) => Math.max(0, current - amount))}
        />
      )}

      {showTabBar && (
        <AppTabBar
          active={appState === 'BASE' ? 'base' : 'train'}
          onChange={handleTab}
          baseHasNews={baseGame.hasNews}
        />
      )}

      {showTutorial && appState === 'HOME' && <GuidedTour onClose={handleTourClose} />}

      {firstSetStage && <FirstSetCoach stage={firstSetStage} />}
    </div>
  );
}
