import { useState, useMemo } from 'react';
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
  Move,
  Variant,
  isRepLoggedCategory,
  resolveMoveById
} from './components/moves';
import { useEquippedLineup } from './hooks/useEquippedLineup';
import { useDailySetGoal } from './hooks/useDailySetGoal';
import { persistOwned, readStoredOwned } from './lib/ownedVariants';
import { RepPrompt } from './components/RepPrompt';
import { recordSetReps } from './lib/repProgress';
import { useAuth } from './context/AuthContext';
import type { SetRepResult } from './types/repProgress';

type AppState = 'HOME' | 'WORKOUT' | 'REP_PROMPT' | 'SUMMARY' | 'STORE' | 'SETTINGS';

export function MainApp() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { dailySetGoal, setDailySetGoal } = useDailySetGoal();
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
    error: statsError,
    recordWorkoutComplete
  } = useUserStats();
  const {
    setsCompleted,
    loading: setsLoading,
    error: setsError,
    incrementSet
  } = useWorkoutProgress(dailySetGoal);
  const screenInit = useScreenInit() as {
    appState?: AppState;
    currentMoveId?: string;
    lastDuration?: number;
  };
  const [appState, setAppState] = useState<AppState>(
    screenInit.appState ?? 'HOME'
  );
  const [owned, setOwned] = useState<string[]>(readStoredOwned);
  const {
    equippedUpper,
    equippedLower,
    equippedCore,
    toggleEquipUpper,
    toggleEquipLower,
    toggleEquipCore
  } = useEquippedLineup(user?.id);

  const initialMove: Move | null = screenInit.currentMoveId
    ? resolveMoveById(screenInit.currentMoveId)
    : null;
  const [currentMove, setCurrentMove] = useState<Move | null>(initialMove);
  const [lastDuration, setLastDuration] = useState<number>(
    screenInit.lastDuration ?? 0
  );
  const [lastSetResult, setLastSetResult] = useState<SetRepResult | null>(null);

  const displayMove = useMemo(
    () => (currentMove ? localizeMove(currentMove, t.moves) : null),
    [currentMove, t.moves]
  );

  const handleSelectMove = (move: Move) => {
    setCurrentMove(move);
    setAppState('WORKOUT');
  };
  const finishWorkoutSession = (duration: number) => {
    if (!currentMove) return;
    void incrementSet(currentMove.categoryId);
    void setCoins((c) => c + Math.max(10, Math.floor(duration / 2)));
    void recordWorkoutComplete();
    setAppState('SUMMARY');
  };

  const handleFinishWorkout = async (
    duration: number,
    trackedReps?: number
  ) => {
    setLastDuration(duration);
    setLastSetResult(null);

    if (currentMove && isRepLoggedCategory(currentMove.categoryId)) {
      if (trackedReps && trackedReps > 0 && user) {
        try {
          const result = await recordSetReps(
            user.id,
            currentMove.categoryId,
            trackedReps
          );
          setLastSetResult(result);
          finishWorkoutSession(duration);
          return;
        } catch {
          // Fall back to manual rep entry if auto-save fails.
        }
      }

      setAppState('REP_PROMPT');
      return;
    }

    finishWorkoutSession(duration);
  };

  const handleRepSubmit = async (reps: number) => {
    if (!currentMove || !user) return;

    const result = await recordSetReps(user.id, currentMove.categoryId, reps);
    setLastSetResult(result);
    finishWorkoutSession(lastDuration);
  };
  const handleCancelWorkout = () => {
    setCurrentMove(null);
    setAppState('HOME');
  };
  const handleGoHome = () => {
    setCurrentMove(null);
    setLastDuration(0);
    setLastSetResult(null);
    setAppState('HOME');
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
      persistOwned(next);
      return next;
    });
  };

  const handleToggleEquipUpper = (exerciseId: string) => {
    if (!owned.includes(exerciseId)) return;
    toggleEquipUpper(exerciseId);
  };

  const handleToggleEquipLower = (exerciseId: string) => {
    if (!owned.includes(exerciseId)) return;
    toggleEquipLower(exerciseId);
  };

  const handleToggleEquipCore = (exerciseId: string) => {
    if (!owned.includes(exerciseId)) return;
    toggleEquipCore(exerciseId);
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f4f0] dark:bg-[#1a1a1a] text-black dark:text-[#f4f4f0] selection:bg-[#CCFF00] selection:text-black">
      {appState === 'HOME' &&
      <Dashboard
        coins={coins}
        currentStreak={currentStreak}
        statsLoading={statsLoading}
        statsCompleting={statsCompleting}
        profileLoading={profileLoading}
        profileError={profileError}
        statsError={statsError}
        setsError={setsError}
        setsLoading={setsLoading}
        equippedUpper={equippedUpper}
        equippedLower={equippedLower}
        equippedCore={equippedCore}
        setsCompleted={setsCompleted}
        dailySetGoal={dailySetGoal}
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
        onToggleEquipCore={handleToggleEquipCore} />

      }

      {appState === 'SETTINGS' &&
      <Settings
        coins={coins}
        dailySetGoal={dailySetGoal}
        isDark={isDark}
        onDailySetGoalChange={setDailySetGoal}
        onToggleDark={toggleDark}
        onBack={handleCloseSettings} />

      }

      {appState === 'WORKOUT' && displayMove &&
      <Workout
        move={displayMove}
        onFinish={(duration, trackedReps) =>
          void handleFinishWorkout(duration, trackedReps)
        }
        onCancel={handleCancelWorkout} />

      }

      {appState === 'REP_PROMPT' && displayMove &&
      <RepPrompt move={displayMove} onSubmit={(reps) => void handleRepSubmit(reps)} />

      }

      {appState === 'SUMMARY' && displayMove &&
      <Summary
        move={displayMove}
        duration={lastDuration}
        setResult={lastSetResult}
        onHome={handleGoHome} />

      }
    </div>
  );
}
