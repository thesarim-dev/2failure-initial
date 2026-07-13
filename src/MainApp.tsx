import { useState, useMemo, useRef } from 'react';
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
import { STREAK_RESTORE_COST } from './lib/userStats';
import { persistOwned, readStoredOwned } from './lib/ownedVariants';
import { RepPrompt } from './components/RepPrompt';
import { WeightRepPrompt } from './components/WeightRepPrompt';
import { recordSetReps } from './lib/repProgress';
import { recordWeightedSetReps } from './lib/weightProgress';
import { resolveSetTargets } from './lib/setPrescription';
import { useWeightUnit } from './hooks/useWeightUnit';
import { useAuth } from './context/AuthContext';
import type { SetRepResult } from './types/repProgress';
import { useOnboarding } from './hooks/useOnboarding';
import { OnboardingTutorial } from './components/OnboardingTutorial';

type AppState =
  | 'HOME'
  | 'WORKOUT'
  | 'REP_PROMPT'
  | 'WEIGHT_REP_PROMPT'
  | 'SUMMARY'
  | 'STORE'
  | 'SETTINGS';

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
    selectProgramCycleDay
  } = useRotatingProgram();
  const {
    coins,
    loading: profileLoading,
    error: profileError,
    setCoins
  } = useProfile();
  const {
    currentStreak,
    loading: statsLoading,
    completing: statsCompleting,
    restoringStreak,
    error: statsError,
    lastWorkoutDate,
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
  const { showTutorial, dismissTutorial } = useOnboarding(user?.id);
  const { weightUnit, setWeightUnit } = useWeightUnit();

  const lineupForToday = useMemo(() => {
    if (rotatingProgramEnabled && rotatingProgramPhase) {
      return resolveRotatingProgramLineup(rotatingProgramPhase);
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
    equippedUpper,
    equippedLower,
    equippedCore
  ]);

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
    options?: { recordComplete?: boolean; setContext?: typeof summarySetContext }
  ) => {
    if (!currentMove) return;
    if (currentMove.categoryId === 'pushups' && repsLogged && repsLogged > 0) {
      addPushupReps(repsLogged);
    }
    void incrementSet(currentMove.categoryId);
    void setCoins((c) => c + calculateCoinsEarned(duration, currentMove.tier ?? 'BASE'));
    if (options?.recordComplete !== false) {
      void recordWorkoutComplete();
    }
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
          finishWorkoutSession(duration, trackedReps);
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
        recordComplete: isLastSet,
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
    finishingRef.current = false;
    setIsFinishing(false);
    setPendingTrackedReps(undefined);
    setSummarySetContext(null);
    setCurrentMove(null);
    setAppState('HOME');
  };
  const handleGoHome = () => {
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
  const handleRestoreStreak = async () => {
    if (!user || coins < STREAK_RESTORE_COST || restoringStreak) return;

    const updated = await restoreUserStreak();
    if (updated) {
      void setCoins((current) => Math.max(0, current - STREAK_RESTORE_COST));
    }
  };

  const handleOpenStore = () => setAppState('STORE');
  const handleCloseStore = () => setAppState('HOME');
  const handleOpenSettings = () => setAppState('SETTINGS');
  const handleCloseSettings = () => setAppState('HOME');
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

  const weightRepContext =
    currentMove && appState === 'WEIGHT_REP_PROMPT'
      ? getWeightedSetContext(currentMove.categoryId)
      : null;

  return (
    <div className="min-h-screen w-full bg-[#f4f4f0] dark:bg-[#1a1a1a] text-black dark:text-[#f4f4f0] selection:bg-[#BEF028] selection:text-black">
      {appState === 'HOME' &&
      <Dashboard
        coins={coins}
        currentStreak={currentStreak}
        statsLoading={statsLoading}
        statsCompleting={statsCompleting}
        restoringStreak={restoringStreak}
        lastWorkoutDate={lastWorkoutDate}
        restoreStreakCost={STREAK_RESTORE_COST}
        onRestoreStreak={handleRestoreStreak}
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
        onSelectProgramCycleDay={selectProgramCycleDay}
        isDark={isDark}
        onDailySetGoalChange={setDailySetGoal}
        onRotatingProgramEnabledChange={setRotatingProgramEnabled}
        onToggleDark={toggleDark}
        weightUnit={weightUnit}
        onWeightUnitChange={setWeightUnit}
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
        onHome={handleGoHome} />

      }

      {showTutorial && <OnboardingTutorial onComplete={dismissTutorial} />}
    </div>
  );
}
