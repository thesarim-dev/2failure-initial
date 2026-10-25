import { DECOR, EDGE_COST, STRUCTURES, TROPHY_ITEM_PREFIX, type Cost } from './catalog';

/**
 * The base economy the server enforces (see the migration
 * 20261027120000_server_economy.sql, generated from this file by
 * scripts/economy-sql.ts so the two never disagree).
 *
 * A base's "value" is the materials it holds plus everything built from them.
 * The server keeps an earned budget per player (raised by each server-checked
 * set) and refuses to save a base worth more than that budget.
 */

/** Budget added per rewarded set: more than the most a set can earn (12, plus the spring bonus). */
export const BUDGET_PER_SET = 25;
/** Extra on the first set of a day: room for the day's quest rewards and session bonus. */
export const BUDGET_FIRST_OF_DAY = 60;
/** Extra on the first set of a week: room for the weekly bonus (12 of each material). */
export const BUDGET_FIRST_OF_WEEK = 40;
/** A new player's budget: starting materials, the free first building, and headroom. */
export const STARTING_BUDGET = 400;

const sum = (c: Cost | undefined) => (c ? (c.stone ?? 0) + (c.timber ?? 0) + (c.crystal ?? 0) : 0);

/** Material value of each level of every structure, of each decoration and of each edge piece. */
export function priceTable() {
  const structures: Record<string, number[]> = {};
  for (const s of STRUCTURES) structures[s.id] = s.levels.map((l) => sum(l.cost));
  const decor: Record<string, number> = {};
  for (const d of DECOR) decor[d.id] = sum(d.cost);
  const edges: Record<string, number> = {};
  for (const [kind, cost] of Object.entries(EDGE_COST)) edges[kind] = sum(cost);
  return { structures, decor, edges };
}

type BaseLike = {
  resources?: Partial<Record<'stone' | 'timber' | 'crystal', number>>;
  placed?: Array<{ uid: string; itemId: string; level: number }>;
  constructions?: Array<{ uid: string; targetLevel: number }>;
  edges?: Record<string, string>;
};

/** Total material value of a saved base: holdings plus everything built or being built. */
export function baseValue(state: BaseLike): number {
  const prices = priceTable();
  let value = Object.values(state.resources ?? {}).reduce((a, n) => a + Math.max(0, Number(n) || 0), 0);
  const jobs = new Map((state.constructions ?? []).map((j) => [j.uid, j.targetLevel]));
  for (const item of state.placed ?? []) {
    if (item.itemId.startsWith(TROPHY_ITEM_PREFIX)) continue; // trophies are earned, not bought
    const levels = prices.structures[item.itemId];
    if (levels) {
      const upTo = Math.max(item.level, jobs.get(item.uid) ?? 0);
      for (let i = 0; i < Math.min(upTo, levels.length); i++) value += levels[i];
    } else value += prices.decor[item.itemId] ?? 0;
  }
  for (const kind of Object.values(state.edges ?? {})) value += prices.edges[kind] ?? 0;
  return value;
}
