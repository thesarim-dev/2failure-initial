import { useCallback, useEffect, useRef, useState } from 'react';
import { storageKeyFor } from '../lib/persistedSettings';
import { getVariantById, isWeightedEquipmentCategory, type Move } from '../components/moves';
import {
  applySet,
  applyStreak,
  createInitialState,
  createInitialStats,
  ensureQuests,
  spendShield,
  tradeMaterials,
  type TodayPlan,
  moveItem,
  placeItem,
  placeTrophy,
  removeItem,
  upgradeItem,
  type ActionResult,
  type GameState,
  type SetReward,
  type SetTier
} from './engine';
import type { ResourceId, TrainingPattern } from './catalog';

/**
 * Iteration 1 keeps the base on this device, per user, like owned exercises.
 * Everything goes through `load`/`save`, so moving to Supabase later is one file.
 */
const STORAGE_KEY = 'base-game';

function load(userId: string | undefined): GameState {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId, STORAGE_KEY));
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as GameState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.placed)) return createInitialState();
    // Fill in fields added after the save was made.
    return {
      ...createInitialState(),
      ...parsed,
      stats: { ...createInitialStats(), ...parsed.stats },
      quests: parsed.quests ?? null,
      shields: parsed.shields ?? 0
    };
  } catch {
    return createInitialState();
  }
}

function save(userId: string | undefined, state: GameState) {
  try {
    window.localStorage.setItem(storageKeyFor(userId, STORAGE_KEY), JSON.stringify(state));
  } catch {
    // Storage full or blocked: the game keeps working for this session.
  }
}

export function patternForMove(move: Move): TrainingPattern {
  if (move.lineupSlot === 'lower') return 'legs';
  if (move.lineupSlot === 'core') return 'core';
  if (move.lineupSlot === 'recovery') return 'recovery';
  return move.pattern === 'pull' ? 'pull' : 'push';
}

export type RecordSetInput = {
  move: Move;
  durationSeconds: number;
  reps?: number;
  verified?: boolean;
};

/**
 * `plan` is today's workout exactly as the Train tab shows it (program day or
 * equipped lineup), or null while it's still loading.
 */
export function useBaseGame(
  userId: string | undefined,
  currentStreak: number,
  plan: TodayPlan | null
) {
  const [state, setState] = useState<GameState>(() => load(userId));
  const [lastReward, setLastReward] = useState<SetReward | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setState(load(userId));
  }, [userId]);

  const commit = useCallback(
    (next: GameState) => {
      stateRef.current = next;
      setState(next);
      save(userId, next);
    },
    [userId]
  );

  const planRef = useRef(plan);
  planRef.current = plan;

  // Today's quests are made once per day, from the plan the player sees.
  useEffect(() => {
    const next = ensureQuests(stateRef.current, plan);
    if (next !== stateRef.current) commit(next);
  }, [plan, commit]);

  // Streak trophies follow the app's streak, which updates after the set is saved.
  useEffect(() => {
    if (!currentStreak) return;
    const { state: next, newTrophies } = applyStreak(stateRef.current, currentStreak);
    if (!newTrophies.length) return;
    commit(next);
    setLastReward((prev) => (prev ? { ...prev, newTrophies: [...prev.newTrophies, ...newTrophies] } : prev));
  }, [currentStreak, commit]);

  const recordSet = useCallback(
    ({ move, durationSeconds, reps, verified }: RecordSetInput): SetReward => {
      const variant = getVariantById(move.categoryId);
      const tier: SetTier = variant?.tier ?? move.tier ?? 'BASE';
      const { state: next, reward } = applySet(stateRef.current, {
        exerciseId: move.categoryId,
        pattern: patternForMove(move),
        tier,
        durationSeconds,
        reps,
        verified,
        loaded: isWeightedEquipmentCategory(move.categoryId),
        plan: planRef.current ?? undefined
      });
      if (next !== stateRef.current) commit(next);
      setLastReward(reward);
      return reward;
    },
    [commit]
  );

  const run = useCallback(
    (result: ActionResult) => {
      if (result.ok) commit(result.state);
      return result;
    },
    [commit]
  );

  const dismissIntro = useCallback(() => {
    commit({ ...stateRef.current, introSeen: true });
  }, [commit]);

  const markSeen = useCallback(() => {
    if (!stateRef.current.unseen.length) return;
    commit({ ...stateRef.current, unseen: [] });
  }, [commit]);

  return {
    state,
    lastReward,
    clearLastReward: () => setLastReward(null),
    recordSet,
    place: (itemId: string, x: number, y: number) => run(placeItem(stateRef.current, itemId, x, y)),
    placeTrophy: (trophyId: string, x: number, y: number) =>
      run(placeTrophy(stateRef.current, trophyId, x, y)),
    upgrade: (uid: string) => run(upgradeItem(stateRef.current, uid)),
    move: (uid: string, x: number, y: number) => run(moveItem(stateRef.current, uid, x, y)),
    remove: (uid: string) => run(removeItem(stateRef.current, uid)),
    trade: (from: ResourceId, to: ResourceId) => run(tradeMaterials(stateRef.current, from, to)),
    spendShield: () => run(spendShield(stateRef.current)),
    plan,
    markSeen,
    dismissIntro,
    hasNews: state.unseen.length > 0
  };
}

export type BaseGame = ReturnType<typeof useBaseGame>;
