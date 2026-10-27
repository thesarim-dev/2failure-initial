import {
  applySet, baseLevel, canPlaceAt, createInitialState, expandLand, hqLevel, nextLandCost,
  placeBlocker, placeItem, upgradeBlocker, upgradeItem, type GameState, type TodayPlan
} from '../src/game/engine';
import { STRUCTURES, buildableBounds } from '../src/game/catalog';
import { planForPhase, type TrainingPhase } from '../src/lib/plan';
import { baseValue, BUDGET_FIRST_OF_DAY, BUDGET_FIRST_OF_WEEK, BUDGET_PER_SET, STARTING_BUDGET } from '../src/game/economy';
import { getLineupSlot } from '../src/components/moves';

/**
 * A consistent player: trains Mon–Fri (5-day plan), 11 sets a day, typical
 * effort, server coins (~27 a set). After each session they build greedily:
 * HQ first, then new buildings, then the lowest upgrade; land when coins spare.
 */
const WEEKS = Number(process.argv[2] ?? 12);
const DAYS_PER_WEEK = Number(process.argv[3] ?? 5);
// The real plan rotation (5-day: push, legs, pull, legs, full body; 3-day: push, legs, pull).
const CYCLE: Record<number, TrainingPhase[]> = { 3: ['push', 'legs', 'pull'], 4: ['push', 'legs', 'pull', 'mixed'], 5: ['push', 'legs', 'pull', 'legs', 'mixed'] };
function exercisesFor(phase: TrainingPhase) {
  return planForPhase(phase, [], {}).map((p) => ({
    id: p.exerciseId,
    pattern: (getLineupSlot(p.exerciseId) ?? 'upper') as 'upper' | 'lower' | 'core',
    target: p.slot.sets,
    refReps: 12
  }));
}
const income = { stone: 0, timber: 0, crystal: 0 };

let state: GameState = createInitialState();
// The server's material budget (20261027120000_server_economy.sql): an honest base must always fit.
let budget = STARTING_BUDGET;
let lastSetDay = '';
let lastSetWeek = '';
let worstOver = -Infinity;
let coins = 0;
const log: string[] = [];
const start = new Date(2026, 10, 2, 9, 0); // Monday 2 Nov 2026

function spot(s: GameState, itemId: string): { x: number; y: number } | null {
  const { min, max } = buildableBounds(s.landLevel);
  for (let y = min; y <= max; y++) for (let x = min; x <= max; x++) if (canPlaceAt(s, itemId, x, y)) return { x, y };
  return null;
}

function buildGreedy() {
  for (let guard = 0; guard < 30; guard++) {
    const hq = s().placed.find((p) => p.itemId === 'hq')!;
    let r = upgradeItem(state, hq.uid, coins);
    if (r.ok) { state = r.state; coins -= r.coinCost ?? 0; continue; }
    let did = false;
    for (const def of STRUCTURES) {
      if (def.id === 'hq' || placeBlocker(state, def.id) !== null) continue;
      const at = spot(state, def.id);
      if (!at) continue;
      r = placeItem(state, def.id, at.x, at.y);
      if (r.ok) { state = r.state; did = true; break; }
    }
    if (did) continue;
    const ups = state.placed
      .filter((p) => p.itemId !== 'hq' && STRUCTURES.some((d) => d.id === p.itemId))
      .sort((a, b) => a.level - b.level);
    for (const p of ups) {
      r = upgradeItem(state, p.uid, coins);
      if (r.ok) { state = r.state; coins -= r.coinCost ?? 0; did = true; break; }
    }
    if (did) continue;
    const land = nextLandCost(state);
    if (land !== null && coins >= land + 1500) {
      const e = expandLand(state);
      if (e.ok) { state = e.state; coins -= land; continue; }
    }
    break;
  }
}
const s = () => state;

for (let w = 0; w < WEEKS; w++) {
  for (let d = 0; d < 7; d++) {
    const day = new Date(start.getTime() + (w * 7 + d) * 86400000);
    if (d >= DAYS_PER_WEEK) continue;
    const EXERCISES = exercisesFor(CYCLE[DAYS_PER_WEEK][(w * DAYS_PER_WEEK + d) % CYCLE[DAYS_PER_WEEK].length]);
    const plan: TodayPlan = {
      day: day.toISOString().slice(0, 10),
      isRestDay: false,
      weeklyTarget: DAYS_PER_WEEK,
      exercises: EXERCISES.map((e) => ({ id: e.id, pattern: e.pattern, target: e.target, done: 0 }))
    };
    let minute = 0;
    for (const ex of plan.exercises) {
      const meta = EXERCISES.find((e) => e.id === ex.id)!;
      for (let k = 0; k < ex.target; k++) {
        const now = new Date(day.getTime() + (minute += 3) * 60000);
        const before = { ...state.resources };
        const { state: next } = applySet(state, {
          exerciseId: ex.id, pattern: ex.pattern, tier: 'BASE', durationSeconds: 45,
          reps: meta.refReps || undefined, refReps: meta.refReps || undefined, refSeconds: meta.refReps ? undefined : 45,
          plan: structuredClone(plan), now
        });
        state = next;
        const dayKey = day.toISOString().slice(0, 10);
        const weekKey = String(w);
        budget += BUDGET_PER_SET + (dayKey !== lastSetDay ? BUDGET_FIRST_OF_DAY : 0) + (weekKey !== lastSetWeek ? BUDGET_FIRST_OF_WEEK : 0);
        lastSetDay = dayKey;
        lastSetWeek = weekKey;
        for (const k of ['stone', 'timber', 'crystal'] as const) income[k] += Math.max(0, state.resources[k] - before[k]);
        coins += 27;
        ex.done += 1;
      }
    }
    buildGreedy();
    worstOver = Math.max(worstOver, baseValue(state) - budget);
  }
  const lv = (id: string) => state.placed.filter((p) => p.itemId === id).map((p) => p.level).join('/') || '-';
  const bl = baseLevel(state);
  log.push(
    `week ${String(w + 1).padStart(2)} | HQ ${hqLevel(state)} | tower ${lv('watchtower')} lodge ${lv('lodge')} forge ${lv('forge')} yard ${lv('yard')} spring ${lv('spring')} | land ${state.landLevel} | base Lv ${bl.level} ${bl.title} (${bl.score}) | left: ${state.resources.stone}/${state.resources.timber}/${state.resources.crystal} | coins ${coins}`
  );
}
console.log(log.join('\n'));
console.log(`server budget check: base value minus budget, worst day = ${worstOver} (must be <= 0)`);
console.log(`income per week (avg): stone ${Math.round(income.stone / WEEKS)}, timber ${Math.round(income.timber / WEEKS)}, crystal ${Math.round(income.crystal / WEEKS)}, coins ~${27 * 11 * DAYS_PER_WEEK}`);
