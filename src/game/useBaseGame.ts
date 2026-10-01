import { useCallback, useEffect, useRef, useState } from 'react';
import { storageKeyFor } from '../lib/persistedSettings';
import { fetchRemoteBase, saveRemoteBase } from '../lib/baseGameRemote';
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
 * The base is saved in Supabase (table `base_games`) so it follows the player
 * across devices. A copy is kept on the device so the base opens instantly and
 * keeps working offline; whichever copy is newer wins when the app starts.
 */
const STORAGE_KEY = 'base-game';
const SAVED_AT_KEY = 'base-game-saved-at';
/** Wait this long after the last change before writing to Supabase. */
const REMOTE_SAVE_DELAY_MS = 1200;

type SaveV1 = Omit<GameState, 'version' | 'constructions' | 'landLevel'> & {
  version: 1;
  construction?: Omit<Construction, 'builders'> | null;
};

/**
 * v1 bases lived on a 10×10 plot where HQ level set the land. v2 uses a 14×14
 * plot with land bought by coins: re-centre everything and keep the land they had.
 */
type SaveV2 = Omit<GameState, 'version'> & { version: 2 };

/**
 * v2 bases lived on a 14×14 plot with land sides 6–14. v3 uses a 20×20 plot
 * with land sides 10–20: re-centre everything (+3) and keep at least the land
 * the player had (their land never shrinks).
 */
function migrateV2(save: SaveV2): GameState {
  const shift = (key: string) => {
    const [x, y] = key.split(',').map(Number);
    return `${x + 3},${y + 3}`;
  };
  const terrain: GameState['terrain'] = {};
  for (const [key, value] of Object.entries(save.terrain ?? {})) terrain[shift(key)] = value;
  return {
    ...save,
    version: 3,
    placed: save.placed.map((p) => ({ ...p, x: p.x + 3, y: p.y + 3 })),
    terrain,
    landLevel: Math.max(0, (save.landLevel ?? 0) - 2)
  };
}

function migrateV1(save: SaveV1): SaveV2 {
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

/** Turns any saved base (local or from Supabase, any version) into current state. */
function parseSave(input: unknown): GameState {
  try {
    const parsed = input as GameState | SaveV2 | SaveV1;
    if (!parsed || !Array.isArray(parsed.placed)) return createInitialState();
    const state =
      parsed.version === 1
        ? migrateV2(migrateV1(parsed))
        : parsed.version === 2
          ? migrateV2(parsed)
          : parsed.version === 3
            ? parsed
            : null;
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

function loadLocal(userId: string | undefined): { state: GameState; savedAt: number } {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId, STORAGE_KEY));
    const savedAt = Number(window.localStorage.getItem(storageKeyFor(userId, SAVED_AT_KEY))) || 0;
    return { state: raw ? parseSave(JSON.parse(raw)) : createInitialState(), savedAt };
  } catch {
    return { state: createInitialState(), savedAt: 0 };
  }
}


function saveLocal(userId: string | undefined, state: GameState, savedAt: number) {
  try {
    window.localStorage.setItem(storageKeyFor(userId, STORAGE_KEY), JSON.stringify(state));
    window.localStorage.setItem(storageKeyFor(userId, SAVED_AT_KEY), String(savedAt));
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
  const [state, setState] = useState<GameState>(() => loadLocal(userId).state);
  const [lastReward, setLastReward] = useState<SetReward | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // --- Supabase sync -------------------------------------------------------
  const remoteTimer = useRef<number | null>(null);
  const pendingRemote = useRef(false);
  const changedSinceLoad = useRef(false);

  const pushRemote = useCallback(async () => {
    if (!userId) return;
    if (remoteTimer.current) window.clearTimeout(remoteTimer.current);
    remoteTimer.current = null;
    pendingRemote.current = true;
    try {
      const savedAt = await saveRemoteBase(userId, stateRef.current);
      pendingRemote.current = false;
      saveLocal(userId, stateRef.current, savedAt);
    } catch {
      // Offline or Supabase unavailable: keep the local copy and retry later.
    }
  }, [userId]);

  const scheduleRemote = useCallback(() => {
    if (!userId) return;
    pendingRemote.current = true;
    if (remoteTimer.current) window.clearTimeout(remoteTimer.current);
    remoteTimer.current = window.setTimeout(() => void pushRemote(), REMOTE_SAVE_DELAY_MS);
  }, [userId, pushRemote]);

  // On start: load the device copy instantly, then use whichever copy is newer.
  useEffect(() => {
    const local = loadLocal(userId);
    stateRef.current = local.state;
    setState(local.state);
    changedSinceLoad.current = false;
    if (!userId) return;
    let cancelled = false;
    fetchRemoteBase(userId)
      .then((remote) => {
        if (cancelled) return;
        if (remote && remote.updatedAt > local.savedAt && !changedSinceLoad.current) {
          const next = parseSave(remote.state);
          stateRef.current = next;
          setState(next);
          saveLocal(userId, next, remote.updatedAt);
        } else if (!remote || local.savedAt > remote.updatedAt || changedSinceLoad.current) {
          // First time on Supabase (uploads the existing base), or this device is newer.
          void pushRemote();
        }
      })
      .catch(() => {
        // Offline: play on the device copy; it uploads on the next change.
      });
    return () => {
      cancelled = true;
    };
  }, [userId, pushRemote]);

  // Don't lose the last change when the app is closed or backgrounded, or come back online.
  useEffect(() => {
    const flush = () => {
      if (pendingRemote.current) void pushRemote();
    };
    const onVisibility = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('online', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pushRemote]);

  const commit = useCallback(
    (next: GameState) => {
      stateRef.current = next;
      changedSinceLoad.current = true;
      setState(next);
      saveLocal(userId, next, Date.now());
      scheduleRemote();
    },
    [userId, scheduleRemote]
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
