import React, { useState } from 'react';
import { useDarkMode } from './hooks/useDarkMode';
import { useScreenInit } from './useScreenInit';
import { Dashboard } from './components/Dashboard';
import { useProfile } from './hooks/useProfile';
import { useUserStats } from './hooks/useUserStats';
import { useWorkoutProgress } from './hooks/useWorkoutProgress';
import { Workout } from './components/Workout';
import { Summary } from './components/Summary';
import { Store } from './components/Store';
import { Move, MOVE_CATEGORIES, Variant, resolveMove } from './components/moves';

type AppState = 'HOME' | 'WORKOUT' | 'SUMMARY' | 'STORE';

const DEFAULT_EQUIPPED = MOVE_CATEGORIES.reduce<Record<string, string>>(
  (acc, cat) => {
    acc[cat.id] = cat.variants[0].id;
    return acc;
  },
  {}
);

const DEFAULT_OWNED = MOVE_CATEGORIES.map((cat) => cat.variants[0].id);

export function MainApp() {
  const { isDark, toggle: toggleDark } = useDarkMode();
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
  } = useWorkoutProgress();
  const screenInit = useScreenInit() as {
    appState?: AppState;
    currentMoveId?: string;
    lastDuration?: number;
  };
  const [appState, setAppState] = useState<AppState>(
    screenInit.appState ?? 'HOME'
  );
  const [owned, setOwned] = useState<string[]>(DEFAULT_OWNED);
  const [equipped, setEquipped] =
  useState<Record<string, string>>(DEFAULT_EQUIPPED);
  const initialMove: Move | null = (() => {
    if (screenInit.currentMoveId) {
      for (const cat of MOVE_CATEGORIES) {
        const match = cat.variants.find(
          (v) => v.id === screenInit.currentMoveId
        );
        if (match) return resolveMove(cat, match.id);
      }
    }
    return null;
  })();
  const [currentMove, setCurrentMove] = useState<Move | null>(initialMove);
  const [lastDuration, setLastDuration] = useState<number>(
    screenInit.lastDuration ?? 0
  );

  const handleSelectMove = (move: Move) => {
    setCurrentMove(move);
    setAppState('WORKOUT');
  };
  const handleFinishWorkout = (duration: number) => {
    setLastDuration(duration);
    if (currentMove) {
      void incrementSet(currentMove.categoryId);
    }
    void setCoins((c) => c + Math.max(10, Math.floor(duration / 2)));
    void recordWorkoutComplete();
    setAppState('SUMMARY');
  };
  const handleCancelWorkout = () => {
    setCurrentMove(null);
    setAppState('HOME');
  };
  const handleGoHome = () => {
    setCurrentMove(null);
    setLastDuration(0);
    setAppState('HOME');
  };
  const handleOpenStore = () => setAppState('STORE');
  const handleCloseStore = () => setAppState('HOME');
  const handleBuy = (categoryId: string, variant: Variant) => {
    if (coins < variant.price || owned.includes(variant.id)) return;
    void setCoins((c) => c - variant.price);
    setOwned((o) => [...o, variant.id]);
    setEquipped((e) => ({
      ...e,
      [categoryId]: variant.id
    }));
  };
  const handleEquip = (categoryId: string, variantId: string) => {
    if (!owned.includes(variantId)) return;
    setEquipped((e) => ({
      ...e,
      [categoryId]: variantId
    }));
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
        equipped={equipped}
        setsCompleted={setsCompleted}
        isDark={isDark}
        onToggleDark={toggleDark}
        onSelectMove={handleSelectMove}
        onOpenStore={handleOpenStore} />

      }

      {appState === 'STORE' &&
      <Store
        coins={coins}
        owned={owned}
        equipped={equipped}
        isDark={isDark}
        onToggleDark={toggleDark}
        onBack={handleCloseStore}
        onBuy={handleBuy}
        onEquip={handleEquip} />

      }

      {appState === 'WORKOUT' && currentMove &&
      <Workout
        move={currentMove}
        onFinish={handleFinishWorkout}
        onCancel={handleCancelWorkout} />

      }

      {appState === 'SUMMARY' && currentMove &&
      <Summary
        move={currentMove}
        duration={lastDuration}
        onHome={handleGoHome} />

      }
    </div>
  );
}
