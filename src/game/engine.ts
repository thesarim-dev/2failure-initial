import {
  EMPTY_RESOURCES,
  GRID_SIZE,
  HQ_POSITION,
  HQ_WEEKS_REQUIRED,
  DECOR_BUILD_SETS,
  HQ_UPGRADE_COIN_COST,
  LAND_COIN_COST,
  MAX_LAND_LEVEL,
  UPGRADE_COIN_COST,
  buildersForLevel,
  BASE_LEVEL_SCORES,
  BASE_LEVEL_TITLES,
  SCORE_BUILDING_LEVEL,
  SCORE_PER_DECOR,
  SCORE_PER_LAND_LEVEL,
  SCORE_PER_TROPHY_EARNED,
  SCORE_PER_TROPHY_PLACED,
  TERRAIN,
  type BaseTitle,
  type TerrainId,
  type Customization,
  PATTERN_RESOURCE,
  RESOURCE_IDS,
  STARTING_RESOURCES,
  TROPHY_ITEM_PREFIX,
  canAfford,
  getItemDef,
  getTrophyDef,
  isTileBuildable,
  type Cost,
  type ResourceId,
  type Resources,
  type StructureDef,
  type TrainingPattern
} from './catalog';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type PlacedItem = {
  uid: string;
  /** Catalogue id, or `trophy:<trophyId>` for a placed trophy. */
  itemId: string;
  x: number;
  y: number;
  /** Finished level. 0 means the first level is still being built. */
  level: number;
  /** Player's chosen style (decor, trophy pedestals). */
  style?: string;
  /** Player's chosen accent colour (a PALETTE id). */
  color?: string;
  /** Mirrored left-to-right. */
  flip?: boolean;
};

export type Construction = {
  uid: string;
  targetLevel: number;
  setsRemaining: number;
  setsTotal: number;
  /** Builders busy on this job until it finishes. */
  builders: number;
};

export type EarnedTrophy = {
  earnedAt: string;
  /** The number behind the trophy (reps, streak days, total sets). */
  value?: number;
  /** Reps were counted by the AI camera. */
  verified?: boolean;
};

export type GameStats = {
  totalSets: number;
  /** App day (3am boundary) of the last counted set, YYYY-MM-DD. */
  day: string | null;
  setsToday: number;
  /** Sets today beyond today's plan. */
  extraSetsToday: number;
  patternSetsToday: Partial<Record<TrainingPattern, number>>;
  /** Monday-based week key of `weekPatterns` and `weekTrainingDays`. */
  week: string | null;
  weekPatterns: TrainingPattern[];
  /** Days this week with at least 2 sets. */
  weekTrainingDays: string[];
  lastTrainingDay: string | null;
  /** Day today's plan was completed (session bonus paid). */
  sessionDay: string | null;
  /** Week the weekly target reward was paid. */
  weeklyRewardWeek: string | null;
  lastTargetWeek: string | null;
  weeklyStreak: number;
  weeksOnTarget: number;
};

export type QuestKind = 'finishExercise' | 'patternSets' | 'inRange' | 'stretch';

export type Quest = {
  id: string;
  kind: QuestKind;
  exerciseId?: string;
  pattern?: TrainingPattern;
  /** Rep range for `inRange`. */
  min?: number;
  max?: number;
  target: number;
  progress: number;
  done: boolean;
  reward: Cost;
};

/** Today's workout as the Train tab shows it: program day or equipped lineup. */
export type PlanExercise = {
  id: string;
  pattern: TrainingPattern;
  /** Sets planned today. */
  target: number;
  /** Sets done today before the current one. */
  done: number;
  /** Top of the useful rep range, for rep-logged moves. */
  repCeiling?: number;
};

export type TodayPlan = {
  day: string;
  isRestDay: boolean;
  /** Training days per week: the program split, or the player's own setting. */
  weeklyTarget: number;
  exercises: PlanExercise[];
};

export type GameState = {
  version: 3;
  resources: Resources;
  placed: PlacedItem[];
  /** Jobs in progress; several can run at once if there are free builders. */
  constructions: Construction[];
  /** Land bought with coins: 0 = 6×6 … 4 = 14×14. */
  landLevel: number;
  trophies: Record<string, EarnedTrophy>;
  stats: GameStats;
  /** New things the player hasn't looked at yet (drives the tab badge). */
  unseen: string[];
  nextUid: number;
  /** The welcome card on the base screen has been dismissed. */
  introSeen?: boolean;
  quests: { day: string; list: Quest[]; planKey?: string } | null;
  /** Lodge streak shields in stock. */
  shields: number;
  /** Painted ground, keyed "x,y". Unpainted tiles are grass. */
  terrain: Record<string, TerrainId>;
  /** The player's name for their base. */
  baseName?: string;
};

export function createInitialState(): GameState {
  return {
    version: 3,
    resources: { ...STARTING_RESOURCES },
    placed: [{ uid: 'u1', itemId: 'hq', x: HQ_POSITION.x, y: HQ_POSITION.y, level: 1 }],
    constructions: [],
    landLevel: 0,
    trophies: {},
    stats: createInitialStats(),
    unseen: [],
    nextUid: 2,
    quests: null,
    shields: 0,
    terrain: {}
  };
}

export function createInitialStats(): GameStats {
  return {
    totalSets: 0,
    day: null,
    setsToday: 0,
    extraSetsToday: 0,
    patternSetsToday: {},
    week: null,
    weekPatterns: [],
    weekTrainingDays: [],
    lastTrainingDay: null,
    sessionDay: null,
    weeklyRewardWeek: null,
    lastTargetWeek: null,
    weeklyStreak: 0,
    weeksOnTarget: 0
  };
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** Same boundary as the app's streaks: a new day starts at 3am. */
const DAY_RESET_HOUR = 3;

function formatDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function localDayKey(date: Date): string {
  const shifted = new Date(date);
  if (shifted.getHours() < DAY_RESET_HOUR) shifted.setDate(shifted.getDate() - 1);
  return formatDay(shifted);
}

export function daysBetween(start: string, end: string): number {
  return Math.round((parseDay(end).getTime() - parseDay(start).getTime()) / 86_400_000);
}

/** Monday-based week key for an app day: the date of that week's Monday. */
export function weekKeyForDay(day: string): string {
  const monday = parseDay(day);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return formatDay(monday);
}

export function localWeekKey(date: Date): string {
  return weekKeyForDay(localDayKey(date));
}

function previousWeekKey(week: string): string {
  const d = parseDay(week);
  d.setDate(d.getDate() - 7);
  return formatDay(d);
}

// ---------------------------------------------------------------------------
// Earning
// ---------------------------------------------------------------------------

/** Sets shorter than this don't earn anything (stops tap-farming). */
export const MIN_SET_SECONDS = 10;
/** Sets beyond today's plan that still earn (at half). After that, nothing. */
export const EXTRA_HALF_SETS = 4;
/** Fallback when no plan is known: sets per day at full, and the hard stop. */
export const FULL_RATE_SETS = 12;
export const DAILY_SET_LIMIT = 20;

/** A typical set earns about this much of its material. */
export const BASE_SET_AMOUNT = 3;
/** The most one set can earn, however big it is. */
export const MAX_SET_AMOUNT = 12;

export type SetTier = 'BASE' | 'PRO' | 'ELITE';

export type SetEvent = {
  exerciseId: string;
  pattern: TrainingPattern;
  tier: SetTier;
  durationSeconds: number;
  reps?: number;
  /** Reps were counted by the AI camera. */
  verified?: boolean;
  /** The exercise uses a loaded backpack. */
  loaded?: boolean;
  /**
   * Effort references for this exercise: the reps (or hold seconds) that make
   * a typical set. More than that earns more; harder moves have smaller refs,
   * so each rep is worth more.
   */
  refReps?: number;
  refSeconds?: number;
  /** Backpack load, which adds to the effort. */
  weightKg?: number;
  /** Today's plan with set counts from *before* this set. */
  plan?: TodayPlan;
  now?: Date;
};

export type EarnRate = 'full' | 'half' | 'limit' | 'tooShort';

export type SetReward = {
  earned: Resources;
  rate: EarnRate;
  /** This set was beyond today's plan. */
  beyondPlan: boolean;
  newTrophies: string[];
  questsDone: Quest[];
  /** Bonus for finishing today's whole plan. */
  session?: Resources;
  /** Bonus for hitting the weekly target. */
  weekly?: Resources;
  /** Crystal Spring bonus included in `earned`. */
  springBonus?: number;
  shieldEarned?: boolean;
  /** Construction progress made by this set, one entry per job. */
  constructions: Array<{ itemId: string; targetLevel: number; setsRemaining: number }>;
};

function each(amount: number): Resources {
  return { stone: amount, timber: amount, crystal: amount };
}

function addTo(target: Resources, add: Cost) {
  for (const id of RESOURCE_IDS) target[id] += add[id] ?? 0;
}

/**
 * How much a set earns, scaled to effort: about 3 for a typical set, more for
 * more reps (relative to how hard the exercise is), longer holds or a heavier
 * backpack, up to a cap.
 */
export function effortAmount(event: Pick<SetEvent, 'reps' | 'durationSeconds' | 'refReps' | 'refSeconds' | 'weightKg'>): number {
  let ratio = 1;
  if (event.reps && event.refReps) ratio = event.reps / event.refReps;
  else if (event.refSeconds && event.durationSeconds) ratio = event.durationSeconds / event.refSeconds;
  if (event.weightKg && event.weightKg > 0) ratio *= 1 + event.weightKg / 20;
  return Math.min(MAX_SET_AMOUNT, Math.max(1, Math.round(BASE_SET_AMOUNT * ratio)));
}

export function earnedForSet(event: SetEvent, rate: EarnRate): Resources {
  const earned = { ...EMPTY_RESOURCES };
  if (rate === 'tooShort' || rate === 'limit') return earned;
  if (event.pattern === 'recovery') {
    // Stretching earns a little of everything: rest days count.
    for (const id of RESOURCE_IDS) earned[id] = 1;
    return earned;
  }
  const amount = effortAmount(event);
  earned[PATTERN_RESOURCE[event.pattern]] = rate === 'half' ? Math.ceil(amount / 2) : amount;
  return earned;
}

function resourceForPattern(pattern: TrainingPattern): ResourceId {
  return pattern === 'recovery' ? 'crystal' : PATTERN_RESOURCE[pattern];
}

/** Highest finished level of a structure type (0 if none built). */
export function structureLevel(state: GameState, itemId: string): number {
  return state.placed
    .filter((p) => p.itemId === itemId)
    .reduce((best, p) => Math.max(best, p.level), 0);
}

/** One quest always, plus one per Watchtower level. */
export function questSlots(state: GameState): number {
  return 1 + structureLevel(state, 'watchtower');
}

/** Streak shields the Lodge can hold. */
export function shieldCapacity(state: GameState): number {
  return structureLevel(state, 'lodge');
}

/** Forge trade rate: how many of one material make one of another. */
export function forgeRate(state: GameState): number | null {
  const level = structureLevel(state, 'forge');
  if (!level) return null;
  return level >= 3 ? 2 : 3;
}

export function sessionBonusAmount(state: GameState, isRestDay: boolean): number {
  return isRestDay ? 2 : 4 + 2 * structureLevel(state, 'yard');
}

export const WEEKLY_BONUS_AMOUNT = 12;

/** Weekly streak as of now: only alive if the target was hit this week or last. */
export function currentWeeklyStreak(state: GameState, now: Date = new Date()): number {
  const week = localWeekKey(now);
  const last = state.stats.lastTargetWeek;
  if (!last) return 0;
  return last === week || last === previousWeekKey(week) ? state.stats.weeklyStreak : 0;
}

export function trainingDaysThisWeek(state: GameState, now: Date = new Date()): number {
  return state.stats.week === localWeekKey(now) ? state.stats.weekTrainingDays.length : 0;
}

// ---------------------------------------------------------------------------
// Trophies
// ---------------------------------------------------------------------------

const PULL_UP_IDS = new Set(['pull-ups', 'chin-ups', 'backpack-pull-ups']);

function award(
  state: GameState,
  id: string,
  now: Date,
  detail: Omit<EarnedTrophy, 'earnedAt'> = {}
): boolean {
  if (state.trophies[id] || !getTrophyDef(id)) return false;
  state.trophies[id] = { earnedAt: now.toISOString(), ...detail };
  state.unseen.push(`trophy:${id}`);
  return true;
}

function awardSetTrophies(state: GameState, event: SetEvent, now: Date): string[] {
  const earned: string[] = [];
  const give = (id: string, detail?: Omit<EarnedTrophy, 'earnedAt'>) => {
    if (award(state, id, now, detail)) earned.push(id);
  };
  const { totalSets } = state.stats;
  const reps = event.reps ?? 0;

  if (totalSets >= 1) give('first-set', { value: 1 });
  if (totalSets >= 50) give('sets-50', { value: 50 });
  if (totalSets >= 250) give('sets-250', { value: 250 });

  if (event.exerciseId === 'pushups') {
    if (reps >= 30) give('pushups-30', { value: reps, verified: event.verified });
    if (reps >= 50) give('pushups-50', { value: reps, verified: event.verified });
  }
  if (PULL_UP_IDS.has(event.exerciseId) && reps >= 1) {
    give('first-pull-up', { value: reps, verified: event.verified });
  }
  if (event.exerciseId === 'pistol-squats' && reps >= 1) {
    give('first-pistol', { value: reps, verified: event.verified });
  }
  if (event.loaded) give('first-loaded');
  if (event.tier === 'ELITE') give('first-elite');

  const patterns = new Set(state.stats.weekPatterns);
  if (['push', 'pull', 'legs', 'core'].every((p) => patterns.has(p as TrainingPattern))) {
    give('balanced-week');
  }
  return earned;
}

const STREAK_TROPHIES: Array<[number, string]> = [
  [3, 'streak-3'],
  [7, 'streak-7'],
  [30, 'streak-30'],
  [100, 'streak-100']
];

/** Streaks are tracked by the app, so they're checked whenever the streak changes. */
export function applyStreak(
  prev: GameState,
  streak: number,
  now: Date = new Date()
): { state: GameState; newTrophies: string[] } {
  const pending = STREAK_TROPHIES.filter(([days, id]) => streak >= days && !prev.trophies[id]);
  if (!pending.length) return { state: prev, newTrophies: [] };
  const state = structuredClone(prev);
  const newTrophies: string[] = [];
  for (const [days, id] of pending) {
    if (award(state, id, now, { value: days })) newTrophies.push(id);
  }
  return { state, newTrophies };
}

// ---------------------------------------------------------------------------
// Quests (Watchtower)
// ---------------------------------------------------------------------------

function hashDay(day: string): number {
  let h = 0;
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function rotate<T>(list: T[], by: number): T[] {
  if (!list.length) return list;
  const k = by % list.length;
  return [...list.slice(k), ...list.slice(0, k)];
}

/**
 * Quests come only from today's plan and never ask for more sets than the
 * plan has. Rest days get a gentle recovery quest.
 */
export function generateQuests(plan: TodayPlan, slots: number): Quest[] {
  if (plan.isRestDay) {
    return [{ id: 'q-stretch', kind: 'stretch', target: 2, progress: 0, done: false, reward: each(2) }];
  }
  const training = plan.exercises.filter((e) => e.pattern !== 'recovery' && e.target > 0);
  if (!training.length) return [];
  const seed = hashDay(plan.day);
  const quests: Quest[] = [];
  const used = new Set<string>();

  // 1. Finish the day's main exercise (the one with the most planned sets).
  const anchor = [...training].sort((a, b) => b.target - a.target)[0];
  quests.push({
    id: `q-finish-${anchor.id}`,
    kind: 'finishExercise',
    exerciseId: anchor.id,
    pattern: anchor.pattern,
    target: anchor.target,
    progress: Math.min(anchor.done, anchor.target),
    done: false,
    reward: { [resourceForPattern(anchor.pattern)]: 6 }
  });
  used.add(anchor.id);

  // 2. Quality over volume: one set inside the move's useful rep range.
  const rangeMove = rotate(
    training.filter((e) => e.repCeiling && !used.has(e.id)),
    seed
  )[0] ?? (anchor.repCeiling ? anchor : undefined);
  if (rangeMove?.repCeiling) {
    quests.push({
      id: `q-range-${rangeMove.id}`,
      kind: 'inRange',
      exerciseId: rangeMove.id,
      pattern: rangeMove.pattern,
      min: 5,
      max: rangeMove.repCeiling,
      target: 1,
      progress: 0,
      done: false,
      reward: { [resourceForPattern(rangeMove.pattern)]: 5, crystal: 2 }
    });
    used.add(rangeMove.id);
  }

  // 3. Sets of a movement type other than the main one.
  const patterns = [...new Set(training.map((e) => e.pattern))].filter((p) => p !== anchor.pattern);
  const pattern = rotate(patterns, seed)[0];
  if (pattern) {
    const planned = training.filter((e) => e.pattern === pattern).reduce((n, e) => n + e.target, 0);
    quests.push({
      id: `q-pattern-${pattern}`,
      kind: 'patternSets',
      pattern,
      target: Math.min(2, planned),
      progress: 0,
      done: false,
      reward: { [resourceForPattern(pattern)]: 5 }
    });
  }

  // 4. Finish one more exercise.
  const other = rotate(training.filter((e) => !used.has(e.id)), seed + 1)[0];
  if (other) {
    quests.push({
      id: `q-finish-${other.id}`,
      kind: 'finishExercise',
      exerciseId: other.id,
      pattern: other.pattern,
      target: other.target,
      progress: Math.min(other.done, other.target),
      done: false,
      reward: { [resourceForPattern(other.pattern)]: 6 }
    });
  }

  return quests.slice(0, Math.max(1, slots));
}

function planKeyOf(plan: TodayPlan): string {
  return `${plan.isRestDay ? 'rest' : 'train'}:${plan.exercises.map((e) => `${e.id}x${e.target}`).sort().join(',')}`;
}

/**
 * Creates today's quests from the plan. Until the first set of the day they
 * follow plan changes (program switched on, lineup edited); after that they
 * stay locked for the day.
 */
export function ensureQuests(prev: GameState, plan: TodayPlan | null | undefined): GameState {
  if (!plan) return prev;
  const key = planKeyOf(plan);
  if (prev.quests?.day === plan.day && prev.quests.list.length) {
    const trainedToday = prev.stats.day === plan.day && prev.stats.setsToday > 0;
    if (trainedToday || prev.quests.planKey === key) return prev;
  }
  if (!plan.isRestDay && !plan.exercises.some((e) => e.target > 0 && e.pattern !== 'recovery')) {
    return prev;
  }
  const state = structuredClone(prev);
  state.quests = { day: plan.day, list: generateQuests(plan, questSlots(prev)), planKey: key };
  return state;
}

function questMatches(quest: Quest, event: SetEvent): boolean {
  if (quest.kind === 'stretch') return event.pattern === 'recovery';
  if (quest.kind === 'patternSets') return quest.pattern === event.pattern;
  if (quest.exerciseId === event.exerciseId) return true;
  // The lineup changed after the quest was made: any set of the same type counts.
  const stillPlanned = event.plan?.exercises.some((e) => e.id === quest.exerciseId) ?? true;
  return !stillPlanned && quest.pattern === event.pattern;
}

// ---------------------------------------------------------------------------
// Recording a set
// ---------------------------------------------------------------------------

function awardConsistencyTrophies(state: GameState, now: Date, earned: string[]) {
  const give = (id: string, value?: number) => {
    if (award(state, id, now, value === undefined ? {} : { value })) earned.push(id);
  };
  if (state.stats.weeksOnTarget >= 1) give('first-week', 1);
  if (state.stats.weeklyStreak >= 4) give('weeks-4', 4);
  if (state.stats.weeklyStreak >= 12) give('weeks-12', 12);
}

export function applySet(prev: GameState, event: SetEvent): { state: GameState; reward: SetReward } {
  const now = event.now ?? new Date();
  const today = localDayKey(now);
  const week = weekKeyForDay(today);
  const reward: SetReward = {
    earned: { ...EMPTY_RESOURCES },
    rate: 'full',
    beyondPlan: false,
    newTrophies: [],
    questsDone: [],
    constructions: []
  };
  if (event.durationSeconds < MIN_SET_SECONDS) {
    reward.rate = 'tooShort';
    return { state: prev, reward };
  }

  const state = structuredClone(ensureQuests(prev, event.plan));
  const stats = state.stats;
  const isFirstSetToday = stats.day !== today;
  if (isFirstSetToday) {
    stats.day = today;
    stats.setsToday = 0;
    stats.extraSetsToday = 0;
    stats.patternSetsToday = {};
  }
  if (stats.week !== week) {
    stats.week = week;
    stats.weekPatterns = [];
    stats.weekTrainingDays = [];
  }

  // Full materials for sets in today's plan; a few extra at half; then nothing.
  const planned = event.plan?.exercises.find((e) => e.id === event.exerciseId);
  if (event.plan) {
    reward.beyondPlan = !planned || planned.done >= planned.target;
    if (reward.beyondPlan) {
      reward.rate = stats.extraSetsToday < EXTRA_HALF_SETS ? 'half' : 'limit';
      stats.extraSetsToday += 1;
    }
  } else {
    const n = stats.setsToday + 1;
    reward.rate = n > DAILY_SET_LIMIT ? 'limit' : n > FULL_RATE_SETS ? 'half' : 'full';
  }

  const daysSinceTraining = stats.lastTrainingDay ? daysBetween(stats.lastTrainingDay, today) : 0;
  stats.setsToday += 1;
  stats.totalSets += 1;
  stats.patternSetsToday[event.pattern] = (stats.patternSetsToday[event.pattern] ?? 0) + 1;
  if (!stats.weekPatterns.includes(event.pattern)) stats.weekPatterns.push(event.pattern);

  reward.earned = earnedForSet(event, reward.rate);

  // Crystal Spring: stretching earns more, and so does the first set after rest.
  const spring = structureLevel(state, 'spring');
  if (spring && reward.rate !== 'limit') {
    let bonus = 0;
    if (event.pattern === 'recovery') bonus += spring;
    if (isFirstSetToday && daysSinceTraining >= 2) bonus += 2 * spring;
    if (bonus) {
      reward.earned[resourceForPattern(event.pattern)] += bonus;
      reward.springBonus = bonus;
    }
  }
  addTo(state.resources, reward.earned);

  // A training day is one with at least 2 sets (same as the app's streak).
  if (stats.setsToday === 2) {
    stats.lastTrainingDay = today;
    if (!stats.weekTrainingDays.includes(today)) stats.weekTrainingDays.push(today);
  }

  // Every job advances with each set that still earns something.
  if (state.constructions.length && reward.rate !== 'limit') {
    const remaining: Construction[] = [];
    for (const job of state.constructions) {
      job.setsRemaining = Math.max(0, job.setsRemaining - 1);
      const item = state.placed.find((p) => p.uid === job.uid);
      if (!item) continue;
      reward.constructions.push({ itemId: item.itemId, targetLevel: job.targetLevel, setsRemaining: job.setsRemaining });
      if (job.setsRemaining === 0) {
        item.level = job.targetLevel;
        state.unseen.push(`built:${item.uid}`);
      } else {
        remaining.push(job);
      }
    }
    state.constructions = remaining;
  }

  // Quests
  if (state.quests?.day === today && reward.rate !== 'limit') {
    for (const quest of state.quests.list) {
      if (quest.done || !questMatches(quest, event)) continue;
      if (quest.kind === 'inRange') {
        const reps = event.reps ?? 0;
        if (reps >= (quest.min ?? 0) && reps <= (quest.max ?? Infinity)) quest.progress = 1;
      } else {
        quest.progress += 1;
      }
      if (quest.progress >= quest.target) {
        quest.done = true;
        addTo(state.resources, quest.reward);
        reward.questsDone.push({ ...quest });
      }
    }
  }

  // Session bonus: today's whole plan is done.
  if (event.plan && event.plan.exercises.length && stats.sessionDay !== today) {
    const complete = event.plan.exercises.every(
      (e) => e.done + (e.id === event.exerciseId ? 1 : 0) >= e.target
    );
    if (complete) {
      stats.sessionDay = today;
      reward.session = each(sessionBonusAmount(state, event.plan.isRestDay));
      addTo(state.resources, reward.session);
      if (award(state, 'first-session', now)) reward.newTrophies.push('first-session');
    }
  }

  // Weekly target: the week's planned training days are done.
  const weeklyTarget = event.plan?.weeklyTarget ?? 0;
  if (weeklyTarget > 0 && stats.weekTrainingDays.length >= weeklyTarget && stats.weeklyRewardWeek !== week) {
    stats.weeklyRewardWeek = week;
    stats.weeksOnTarget += 1;
    stats.weeklyStreak = stats.lastTargetWeek === previousWeekKey(week) ? stats.weeklyStreak + 1 : 1;
    stats.lastTargetWeek = week;
    reward.weekly = each(WEEKLY_BONUS_AMOUNT);
    addTo(state.resources, reward.weekly);
    if (state.shields < shieldCapacity(state)) {
      state.shields += 1;
      reward.shieldEarned = true;
    }
    awardConsistencyTrophies(state, now, reward.newTrophies);
  }

  reward.newTrophies.push(...awardSetTrophies(state, event, now));
  return { state, reward };
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

export function hqLevel(state: GameState): number {
  return state.placed.find((p) => p.itemId === 'hq')?.level ?? 1;
}

export function itemSize(itemId: string): 1 | 2 {
  if (itemId.startsWith(TROPHY_ITEM_PREFIX)) return 1;
  return getItemDef(itemId)?.size ?? 1;
}

function tilesOf(x: number, y: number, size: number): Array<[number, number]> {
  const tiles: Array<[number, number]> = [];
  for (let dx = 0; dx < size; dx++) for (let dy = 0; dy < size; dy++) tiles.push([x + dx, y + dy]);
  return tiles;
}

/** Map of "x,y" → uid for every occupied tile. */
export function occupancy(state: GameState): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of state.placed) {
    for (const [tx, ty] of tilesOf(item.x, item.y, itemSize(item.itemId))) {
      map.set(`${tx},${ty}`, item.uid);
    }
  }
  return map;
}

export function canPlaceAt(
  state: GameState,
  itemId: string,
  x: number,
  y: number,
  ignoreUid?: string
): boolean {
  const size = itemSize(itemId);
  const occupied = occupancy(state);
  const def = getItemDef(itemId);
  const wantsWater = def?.kind === 'decor' && def.onWater === true;
  return tilesOf(x, y, size).every(([tx, ty]) => {
    if (tx < 0 || ty < 0 || tx >= GRID_SIZE || ty >= GRID_SIZE) return false;
    if (!isTileBuildable(tx, ty, state.landLevel)) return false;
    // Water decor only on water; everything else only on land.
    const isWater = state.terrain?.[`${tx},${ty}`] === 'water';
    if (isWater !== wantsWater) return false;
    const owner = occupied.get(`${tx},${ty}`);
    return !owner || owner === ignoreUid;
  });
}

export function countPlaced(state: GameState, itemId: string): number {
  return state.placed.filter((p) => p.itemId === itemId).length;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type ActionError =
  | 'locked'
  | 'maxCount'
  | 'builderBusy'
  | 'cantAfford'
  | 'blocked'
  | 'maxLevel'
  | 'needsHq'
  | 'notEarned'
  | 'alreadyPlaced'
  | 'notRemovable'
  | 'needsWeeks'
  | 'noForge'
  | 'noShield'
  | 'sameResource'
  | 'needsBuilders'
  | 'needsCoins'
  | 'maxLand'
  | 'underConstruction'
  | 'needsBaseLevel'
  | 'water';

export type ActionResult =
  | { ok: true; state: GameState; /** Coins the caller must deduct. */ coinCost?: number }
  | { ok: false; error: ActionError };

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

/** One builder at HQ, plus one per Lodge level. */
export function totalBuilders(state: GameState): number {
  return 1 + structureLevel(state, 'lodge');
}

export function busyBuilders(state: GameState): number {
  return state.constructions.reduce((n, job) => n + job.builders, 0);
}

export function freeBuilders(state: GameState): number {
  return Math.max(0, totalBuilders(state) - busyBuilders(state));
}

export function jobFor(state: GameState, uid: string): Construction | undefined {
  return state.constructions.find((job) => job.uid === uid);
}

function applyCustom(item: PlacedItem, custom?: Customization) {
  if (custom?.style) item.style = custom.style;
  if (custom?.color) item.color = custom.color;
}

function pay(state: GameState, cost: Cost) {
  for (const id of RESOURCE_IDS) state.resources[id] -= cost[id] ?? 0;
}

/** Why an item can't be placed right now, or null if it can. */
export function placeBlocker(state: GameState, itemId: string): ActionError | null {
  const def = getItemDef(itemId);
  if (!def) return 'locked';
  const level = hqLevel(state);
  if (level < def.unlockHq) return 'locked';
  if (def.kind === 'decor' && def.unlockBase && baseLevel(state).level < def.unlockBase) return 'needsBaseLevel';
  if (def.kind === 'structure' && countPlaced(state, itemId) >= def.maxCount(level)) return 'maxCount';
  if (freeBuilders(state) < 1) return 'builderBusy';
  const cost = def.kind === 'structure' ? def.levels[0].cost : def.cost;
  if (!canAfford(state.resources, cost)) return 'cantAfford';
  return null;
}

export function placeItem(
  prev: GameState,
  itemId: string,
  x: number,
  y: number,
  custom?: Customization
): ActionResult {
  const blocker = placeBlocker(prev, itemId);
  if (blocker) return { ok: false, error: blocker };
  if (!canPlaceAt(prev, itemId, x, y)) return { ok: false, error: 'blocked' };
  const def = getItemDef(itemId)!;
  const state = structuredClone(prev);
  const uid = `u${state.nextUid++}`;
  const sets = def.kind === 'structure' ? def.levels[0].sets : DECOR_BUILD_SETS;
  pay(state, def.kind === 'structure' ? def.levels[0].cost : def.cost);
  const item: PlacedItem = { uid, itemId, x, y, level: sets === 0 ? 1 : 0 };
  applyCustom(item, custom);
  state.placed.push(item);
  if (sets > 0) {
    state.constructions.push({ uid, targetLevel: 1, setsRemaining: sets, setsTotal: sets, builders: 1 });
  }
  return { ok: true, state };
}

/** Trophies are free to place but still need a builder for one set. */
export function trophyBlocker(state: GameState, trophyId: string): ActionError | null {
  if (!state.trophies[trophyId]) return 'notEarned';
  if (state.placed.some((p) => p.itemId === `${TROPHY_ITEM_PREFIX}${trophyId}`)) return 'alreadyPlaced';
  if (freeBuilders(state) < 1) return 'builderBusy';
  return null;
}

export function placeTrophy(
  prev: GameState,
  trophyId: string,
  x: number,
  y: number,
  custom?: Customization
): ActionResult {
  const blocker = trophyBlocker(prev, trophyId);
  if (blocker) return { ok: false, error: blocker };
  const itemId = `${TROPHY_ITEM_PREFIX}${trophyId}`;
  if (!canPlaceAt(prev, itemId, x, y)) return { ok: false, error: 'blocked' };
  const state = structuredClone(prev);
  const uid = `u${state.nextUid++}`;
  const item: PlacedItem = { uid, itemId, x, y, level: 0 };
  applyCustom(item, custom);
  state.placed.push(item);
  state.constructions.push({ uid, targetLevel: 1, setsRemaining: DECOR_BUILD_SETS, setsTotal: DECOR_BUILD_SETS, builders: 1 });
  return { ok: true, state };
}

/** Coins needed to upgrade a structure to its next level. */
export function upgradeCoinCost(itemId: string, targetLevel: number): number {
  return (itemId === 'hq' ? HQ_UPGRADE_COIN_COST : UPGRADE_COIN_COST)[targetLevel] ?? 0;
}

/** Why a structure can't be upgraded right now, or null if it can. */
export function upgradeBlocker(state: GameState, uid: string, coins = Infinity): ActionError | null {
  const item = state.placed.find((p) => p.uid === uid);
  const def = item && getItemDef(item.itemId);
  if (!item || !def || def.kind !== 'structure') return 'locked';
  if (item.level >= def.levels.length) return 'maxLevel';
  if (jobFor(state, uid)) return 'underConstruction';
  const target = item.level + 1;
  if (def.id === 'hq' && state.stats.weeksOnTarget < (HQ_WEEKS_REQUIRED[target] ?? 0)) return 'needsWeeks';
  // Other buildings can't outgrow headquarters.
  if (def.id !== 'hq' && item.level >= hqLevel(state)) return 'needsHq';
  if (freeBuilders(state) < buildersForLevel(target)) return 'needsBuilders';
  if (!canAfford(state.resources, def.levels[item.level].cost)) return 'cantAfford';
  if (coins < upgradeCoinCost(def.id, target)) return 'needsCoins';
  return null;
}

export function upgradeItem(prev: GameState, uid: string, coins = Infinity): ActionResult {
  const blocker = upgradeBlocker(prev, uid, coins);
  if (blocker) return { ok: false, error: blocker };
  const state = structuredClone(prev);
  const item = state.placed.find((p) => p.uid === uid)!;
  const def = getItemDef(item.itemId) as StructureDef;
  const target = item.level + 1;
  const next = def.levels[item.level];
  pay(state, next.cost);
  state.constructions.push({
    uid,
    targetLevel: target,
    setsRemaining: next.sets,
    setsTotal: next.sets,
    builders: buildersForLevel(target)
  });
  return { ok: true, state, coinCost: upgradeCoinCost(def.id, target) };
}

/** Coins for the next land expansion, or null at the maximum. */
export function nextLandCost(state: GameState): number | null {
  return state.landLevel >= MAX_LAND_LEVEL ? null : LAND_COIN_COST[state.landLevel + 1];
}

export function expandLand(prev: GameState, coins: number): ActionResult {
  const cost = nextLandCost(prev);
  if (cost === null) return { ok: false, error: 'maxLand' };
  if (coins < cost) return { ok: false, error: 'needsCoins' };
  return { ok: true, state: { ...prev, landLevel: prev.landLevel + 1 }, coinCost: cost };
}

/** Change an item's style or colour. Free, any time. */
export function customizeItem(prev: GameState, uid: string, custom: Customization): ActionResult {
  if (!prev.placed.some((p) => p.uid === uid)) return { ok: false, error: 'notRemovable' };
  const state = structuredClone(prev);
  applyCustom(state.placed.find((p) => p.uid === uid)!, custom);
  return { ok: true, state };
}

export function moveItem(prev: GameState, uid: string, x: number, y: number): ActionResult {
  const item = prev.placed.find((p) => p.uid === uid);
  if (!item || item.itemId === 'hq') return { ok: false, error: 'notRemovable' };
  if (!canPlaceAt(prev, item.itemId, x, y, uid)) return { ok: false, error: 'blocked' };
  const state = structuredClone(prev);
  const moved = state.placed.find((p) => p.uid === uid)!;
  moved.x = x;
  moved.y = y;
  return { ok: true, state };
}

/** Decor is refunded in full; trophies go back to the shelf. Buildings stay. */
export function removeItem(prev: GameState, uid: string): ActionResult {
  const item = prev.placed.find((p) => p.uid === uid);
  if (!item) return { ok: false, error: 'notRemovable' };
  const isTrophy = item.itemId.startsWith(TROPHY_ITEM_PREFIX);
  const def = getItemDef(item.itemId);
  if (!isTrophy && def?.kind !== 'decor') return { ok: false, error: 'notRemovable' };
  const state = structuredClone(prev);
  state.placed = state.placed.filter((p) => p.uid !== uid);
  state.constructions = state.constructions.filter((job) => job.uid !== uid);
  if (def?.kind === 'decor') {
    for (const id of RESOURCE_IDS) state.resources[id] += def.cost[id] ?? 0;
  }
  return { ok: true, state };
}

/** Forge: trade one material for another at a loss, `amountOut` at a time. */
export function tradeMaterials(
  prev: GameState,
  from: ResourceId,
  to: ResourceId,
  amountOut = 5
): ActionResult {
  const rate = forgeRate(prev);
  if (!rate) return { ok: false, error: 'noForge' };
  if (from === to) return { ok: false, error: 'sameResource' };
  const cost = rate * amountOut;
  if (prev.resources[from] < cost) return { ok: false, error: 'cantAfford' };
  const state = structuredClone(prev);
  state.resources[from] -= cost;
  state.resources[to] += amountOut;
  return { ok: true, state };
}

/** Lodge: spend a shield (the streak restore itself is done by the app). */
export function spendShield(prev: GameState): ActionResult {
  if (prev.shields < 1) return { ok: false, error: 'noShield' };
  return { ok: true, state: { ...prev, shields: prev.shields - 1 } };
}

// ---------------------------------------------------------------------------
// Decorating freedom: terrain, flipping, naming
// ---------------------------------------------------------------------------

export function terrainUnlocked(state: GameState, terrain: TerrainId): boolean {
  const def = TERRAIN.find((t) => t.id === terrain);
  return !!def && baseLevel(state).level >= def.unlockBase;
}

/**
 * Paint tiles with a terrain. Free: decorating should feel open. Only owned
 * land can be painted, and tiles under items can't become water (and water
 * under water decor can't be painted over).
 */
export function paintTerrain(prev: GameState, tiles: Array<[number, number]>, terrain: TerrainId): ActionResult {
  if (!terrainUnlocked(prev, terrain)) return { ok: false, error: 'needsBaseLevel' };
  const occupied = occupancy(prev);
  const state: GameState = { ...prev, terrain: { ...prev.terrain } };
  let changed = false;
  for (const [x, y] of tiles) {
    if (!isTileBuildable(x, y, prev.landLevel)) continue;
    const key = `${x},${y}`;
    const current = prev.terrain[key] ?? 'grass';
    if (current === terrain) continue;
    const ownerUid = occupied.get(key);
    if (ownerUid) {
      const owner = prev.placed.find((p) => p.uid === ownerUid);
      const ownerDef = owner && getItemDef(owner.itemId);
      const ownerOnWater = ownerDef?.kind === 'decor' && ownerDef.onWater === true;
      // Keep items on the ground they need.
      if ((terrain === 'water') !== ownerOnWater) continue;
    }
    if (terrain === 'grass') delete state.terrain[key];
    else state.terrain[key] = terrain;
    changed = true;
  }
  return changed ? { ok: true, state } : { ok: false, error: 'blocked' };
}

export function flipItem(prev: GameState, uid: string): ActionResult {
  if (!prev.placed.some((p) => p.uid === uid)) return { ok: false, error: 'notRemovable' };
  const state = structuredClone(prev);
  const item = state.placed.find((p) => p.uid === uid)!;
  item.flip = !item.flip;
  return { ok: true, state };
}

export function setBaseName(prev: GameState, name: string): GameState {
  return { ...prev, baseName: name.trim().slice(0, 32) || undefined };
}

// ---------------------------------------------------------------------------
// Base level (prestige)
// ---------------------------------------------------------------------------

/** Everything the player built, upgraded and earned adds to the base score. */
export function baseScore(state: GameState): number {
  let score = 0;
  for (const item of state.placed) {
    const def = getItemDef(item.itemId);
    if (item.itemId.startsWith(TROPHY_ITEM_PREFIX)) {
      if (item.level > 0) score += SCORE_PER_TROPHY_PLACED;
    } else if (def?.kind === 'structure') {
      const points = SCORE_BUILDING_LEVEL[Math.min(item.level, 3)] ?? 0;
      score += def.id === 'hq' ? points * 2 : points;
    } else if (def?.kind === 'decor' && item.level > 0) {
      score += SCORE_PER_DECOR;
    }
  }
  score += Object.keys(state.trophies).length * SCORE_PER_TROPHY_EARNED;
  score += state.landLevel * SCORE_PER_LAND_LEVEL;
  return score;
}

export type BaseLevelInfo = {
  level: number;
  title: BaseTitle;
  score: number;
  /** Score where this level started, and where the next begins (null at max). */
  floor: number;
  next: number | null;
};

export function baseLevel(state: GameState): BaseLevelInfo {
  const score = baseScore(state);
  let index = 0;
  for (let i = 0; i < BASE_LEVEL_SCORES.length; i++) if (score >= BASE_LEVEL_SCORES[i]) index = i;
  return {
    level: index + 1,
    title: BASE_LEVEL_TITLES[index],
    score,
    floor: BASE_LEVEL_SCORES[index],
    next: BASE_LEVEL_SCORES[index + 1] ?? null
  };
}

/** A base goes quiet (lights dim) on days without a set. Nothing is lost. */
export function isQuietToday(state: GameState, now: Date = new Date()): boolean {
  return state.stats.day !== localDayKey(now) || state.stats.setsToday === 0;
}

export function resourcesOf(reward: SetReward): Array<[ResourceId, number]> {
  return RESOURCE_IDS.filter((id) => reward.earned[id] > 0).map((id) => [id, reward.earned[id]]);
}
