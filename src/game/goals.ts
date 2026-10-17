import {
  BASE_LEVEL_TITLES,
  DECOR,
  HQ_WEEKS_REQUIRED,
  RESOURCE_IDS,
  buildersForLevel,
  getItemDef,
  type BaseTitle,
  type Cost,
  type ResourceId,
  type StructureDef
} from './catalog';
import {
  baseLevel,
  countPlaced,
  freeBuilders,
  hqLevel,
  jobFor,
  nextLandCost,
  placeBlocker,
  upgradeBlocker,
  upgradeCoinCost,
  type GameState
} from './engine';

/**
 * "Next up": the player's next goals, worked out from the real rules and in
 * dependency order (e.g. a Lodge comes before the HQ upgrade that needs its
 * builder). Each goal lists exactly what's still missing and roughly how many
 * sets that is, so progress is always concrete.
 */

/** Rough earnings per set, for "≈ N sets" hints. */
export const COINS_PER_SET = 26;
export const MATERIAL_PER_SET = 4;

export type GoalReq =
  | { kind: 'resource'; id: ResourceId; have: number; need: number }
  | { kind: 'coins'; have: number; need: number }
  | { kind: 'builders'; have: number; need: number }
  | { kind: 'weeks'; have: number; need: number };

export type Goal =
  | { kind: 'construction'; uid: string; itemId: string; targetLevel: number; setsDone: number; setsTotal: number }
  | { kind: 'upgrade'; uid: string; itemId: string; targetLevel: number; reqs: GoalReq[]; ready: boolean }
  | { kind: 'build'; itemId: string; reqs: GoalReq[]; ready: boolean }
  | { kind: 'level'; level: number; title: BaseTitle; score: number; floor: number; next: number; unlocks: string[] }
  | { kind: 'land'; cost: number; coins: number; ready: boolean };

export function reqMet(req: GoalReq): boolean {
  return req.have >= req.need;
}

/** Sets still needed for a requirement (resources and coins only). */
export function setsFor(req: GoalReq): number {
  const missing = Math.max(0, req.need - req.have);
  if (missing === 0) return 0;
  if (req.kind === 'coins') return Math.ceil(missing / COINS_PER_SET);
  if (req.kind === 'resource') return Math.ceil(missing / MATERIAL_PER_SET);
  return 0;
}

/** 0..1: how close a list of requirements is to done. */
export function goalProgress(goal: Goal): number {
  if (goal.kind === 'construction') return goal.setsTotal ? goal.setsDone / goal.setsTotal : 1;
  if (goal.kind === 'level') return Math.min(1, (goal.score - goal.floor) / Math.max(1, goal.next - goal.floor));
  if (goal.kind === 'land') return Math.min(1, goal.coins / goal.cost);
  if (!goal.reqs.length) return 1;
  return goal.reqs.reduce((sum, r) => sum + Math.min(1, r.need ? r.have / r.need : 1), 0) / goal.reqs.length;
}

function costReqs(state: GameState, cost: Cost): GoalReq[] {
  return RESOURCE_IDS.filter((id) => (cost[id] ?? 0) > 0).map((id) => ({
    kind: 'resource' as const,
    id,
    have: state.resources[id],
    need: cost[id] ?? 0
  }));
}

function upgradeGoal(state: GameState, coins: number, uid: string): Goal | null {
  const item = state.placed.find((p) => p.uid === uid);
  const def = item && (getItemDef(item.itemId) as StructureDef | undefined);
  if (!item || !def || def.kind !== 'structure' || item.level >= def.levels.length || jobFor(state, uid)) return null;
  const target = item.level + 1;
  const reqs: GoalReq[] = [
    ...costReqs(state, def.levels[item.level].cost),
    { kind: 'coins', have: coins, need: upgradeCoinCost(def.id, target) },
    { kind: 'builders', have: freeBuilders(state), need: buildersForLevel(target) }
  ];
  const weeks = def.id === 'hq' ? HQ_WEEKS_REQUIRED[target] ?? 0 : 0;
  if (weeks > 0) reqs.push({ kind: 'weeks', have: state.stats.weeksOnTarget, need: weeks });
  return { kind: 'upgrade', uid, itemId: def.id, targetLevel: target, reqs, ready: upgradeBlocker(state, uid, coins) === null };
}

function buildGoal(state: GameState, itemId: string): Goal | null {
  const def = getItemDef(itemId) as StructureDef | undefined;
  if (!def || def.kind !== 'structure') return null;
  const blocker = placeBlocker(state, itemId);
  if (blocker === 'locked' || blocker === 'maxCount') return null;
  const reqs: GoalReq[] = [...costReqs(state, def.levels[0].cost), { kind: 'builders', have: freeBuilders(state), need: 1 }];
  return { kind: 'build', itemId, reqs, ready: blocker === null };
}

const NEW_BUILDING_ORDER = ['lodge', 'watchtower', 'forge', 'spring', 'yard'];

export function computeGoals(state: GameState, coins: number, max = 4): Goal[] {
  const goals: Goal[] = [];
  const seen = new Set<string>();
  const push = (goal: Goal | null) => {
    if (!goal) return;
    const key = goal.kind === 'level' || goal.kind === 'land' ? goal.kind : `${goal.kind}:${'uid' in goal ? goal.uid : goal.itemId}`;
    if (seen.has(key)) return;
    seen.add(key);
    goals.push(goal);
  };

  // 1. Anything being built right now.
  for (const job of state.constructions.slice(0, 2)) {
    const item = state.placed.find((p) => p.uid === job.uid);
    if (item) {
      push({
        kind: 'construction',
        uid: job.uid,
        itemId: item.itemId,
        targetLevel: job.targetLevel,
        setsDone: job.setsTotal - job.setsRemaining,
        setsTotal: job.setsTotal
      });
    }
  }

  // 2. The HQ is the spine of progress; a Lodge (builders) comes first if the HQ needs one.
  const hq = state.placed.find((p) => p.itemId === 'hq');
  const hqUpgrade = hq ? upgradeGoal(state, coins, hq.uid) : null;
  if (hq && hqUpgrade && hqUpgrade.kind === 'upgrade') {
    const needsBuilder = hqUpgrade.reqs.some((r) => r.kind === 'builders' && !reqMet(r));
    if (needsBuilder && !state.constructions.length) {
      const lodge = state.placed.find((p) => p.itemId === 'lodge');
      if (!lodge) push(buildGoal(state, 'lodge'));
      else if (lodge.level < hqLevel(state)) push(upgradeGoal(state, coins, lodge.uid));
    }
    push(hqUpgrade);
  }

  // 3. The next new building worth having.
  for (const id of NEW_BUILDING_ORDER) {
    if (countPlaced(state, id) > 0) continue;
    const goal = buildGoal(state, id);
    if (goal) {
      push(goal);
      break;
    }
  }

  // 4. Upgrade an existing building that can keep up with the HQ.
  if (goals.length < max) {
    const level = hqLevel(state);
    const candidate = state.placed.find((p) => {
      const def = getItemDef(p.itemId);
      return def?.kind === 'structure' && p.itemId !== 'hq' && p.level > 0 && p.level < level && !jobFor(state, p.uid);
    });
    if (candidate) push(upgradeGoal(state, coins, candidate.uid));
  }

  // 5. Base level: what the next level unlocks.
  const info = baseLevel(state);
  if (info.next !== null) {
    const nextLevel = info.level + 1;
    const unlocks = DECOR.filter((d) => d.unlockBase === nextLevel).map((d) => d.id);
    push({
      kind: 'level',
      level: nextLevel,
      title: BASE_LEVEL_TITLES[nextLevel - 1] ?? info.title,
      score: info.score,
      floor: info.floor,
      next: info.next,
      unlocks
    });
  }

  // 6. More land, once it's within reach.
  const landCost = nextLandCost(state);
  if (landCost !== null && coins >= landCost * 0.6) {
    push({ kind: 'land', cost: landCost, coins, ready: coins >= landCost });
  }

  return goals.slice(0, max);
}
