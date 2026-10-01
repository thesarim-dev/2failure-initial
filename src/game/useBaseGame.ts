import { useCallback, useEffect, useRef, useState } from 'react';
import { storageKeyFor } from '../lib/persistedSettings';
import { getVariantById, isWeightedEquipmentCategory, type Move } from '../components/moves';
import {
  applySet,
  applyStreak,
  customizeItem,
  expandLand,
  flipItem,
  paintTerrain,
  setBaseName,
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
  type Construction,
  type GameState,
  type PlacedItem,
  type SetReward,
  type SetTier
} from './engine';
import type { Customization, ResourceId, TerrainId, TrainingPattern } from './catalog';

/**
 * Iteration 1 keeps the base on this device, per user, like owned exercises.
 * Everything goes through `load`/`save`, so moving to Supabase later is one file.
 */
const STORAGE_KEY = 'base-game';

type SaveV1 = Omit<GameState, 'version' | 'constructions' | 'landLevel'> & {
  version: 1;
  construction?: Omit<Construction, 'builders'> | null;
};

/**
 * v1 bases lived on a 10×10 plot where HQ level set the land. v2 uses a 14×14
 * plot with land bought by coins: re-centre everything and keep the land they had.
 */
function migrateV1(save: SaveV1): GameState {
  const hq = save.placed.find((p) => p.itemId === 'hq')?.level ?? 1;
  const placed: PlacedItem[] = save.placed.map((p) => ({ ...p, x: p.x + 2, y: p.y + 2 }));
  const job = save.construction;
  const { construction: _old, ...rest } = save;
  void _old;
  return {
    ...createInitialState(),
    ...rest,
    version: 2,
    placed,
    landLevel: Math.min(2, Math.max(0, hq - 1)),
    constructions: job ? [{ ...job, builders: 1 }] : []
  };
}

function load(userId: string | undefined): GameState {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId, STORAGE_KEY));
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as GameState | SaveV1;
    if (!parsed || !Array.isArray(parsed.placed)) return createInitialState();
    const state = parsed.version === 1 ? migrateV1(parsed) : parsed.version === 2 ? parsed : null;
    if (!state) return createInitialState();
    // Iron was retired: its stock becomes timber (both came from leg sets).
    const resources = { ...(state.resources as Record<string, number>) };
    if ('iron' in resources) {
      resources.timber = (resources.timber ?? 0) + (resources.iron ?? 0);
      delete resources.iron;
    }
    // Fill in fields added after the save was made.
    return {
      ...createInitialState(),
      ...state,
      resources: { stone: resources.stone ?? 0, timber: resources.timber ?? 0, crystal: resources.crystal ?? 0 },
      stats: { ...createInitialStats(), ...state.stats },
      constructions: state.constructions ?? [],
      landLevel: state.landLevel ?? 0,
      quests: state.quests ?? null,
      shields: state.shields ?? 0,
      terrain: state.terrain ?? {}
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
  /** Backpack load for loaded sets. */
  weightKg?: number;
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
    ({ move, durationSeconds, reps, verified, weightKg }: RecordSetInput): SetReward => {
      const variant = getVariantById(move.categoryId);
      const tier: SetTier = variant?.tier ?? move.tier ?? 'BASE';
      const loaded = isWeightedEquipmentCategory(move.categoryId);
      // Half the top of the useful rep range is a typical set (3 materials);
      // harder moves have lower ceilings, so each rep counts for more.
      const refReps = variant?.repCeiling ? Math.max(3, variant.repCeiling / 2) : loaded ? 6 : undefined;
      const refSeconds = variant?.holdCeilingSeconds ? variant.holdCeilingSeconds / 2 : undefined;
      const { state: next, reward } = applySet(stateRef.current, {
        exerciseId: move.categoryId,
        pattern: patternForMove(move),
        tier,
        durationSeconds,
        reps,
        verified,
        loaded,
        refReps,
        refSeconds,
        weightKg,
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
    place: (itemId: string, x: number, y: number, custom?: Customization) =>
      run(placeItem(stateRef.current, itemId, x, y, custom)),
    placeTrophy: (trophyId: string, x: number, y: number, custom?: Customization) =>
      run(placeTrophy(stateRef.current, trophyId, x, y, custom)),
    /** `coins` is the player's balance; the caller deducts `coinCost` on success. */
    upgrade: (uid: string, coins: number) => run(upgradeItem(stateRef.current, uid, coins)),
    expandLand: (coins: number) => run(expandLand(stateRef.current, coins)),
    customize: (uid: string, custom: Customization) => run(customizeItem(stateRef.current, uid, custom)),
    paint: (tiles: Array<[number, number]>, terrain: TerrainId) => run(paintTerrain(stateRef.current, tiles, terrain)),
    flip: (uid: string) => run(flipItem(stateRef.current, uid)),
    rename: (name: string) => commit(setBaseName(stateRef.current, name)),
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
