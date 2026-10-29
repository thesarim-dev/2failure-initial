import { baseValue, BUDGET_FIRST_OF_DAY, BUDGET_FIRST_OF_WEEK, BUDGET_PER_SET, STARTING_BUDGET } from '../src/game/economy';
/* Demo-only stand-in for @supabase/supabase-js: an in-browser database in
   localStorage, so the demo works with no server. Not part of the real app. */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;
const DB_KEY = '2failure-demo-db';
const SESSION_KEY = '2failure-demo-session';
const UNIQUE: Record<string, string[]> = {
  profiles: ['id'],
  user_stats: ['user_id'],
  user_workouts: ['user_id', 'category_id'],
  base_games: ['user_id'],
  push_subscriptions: ['endpoint']
};

function loadDb(): Record<string, Row[]> {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveDb(db: Record<string, Row[]>) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}
function table(name: string): Row[] {
  const db = loadDb();
  return db[name] ?? [];
}
function writeTable(name: string, rows: Row[]) {
  const db = loadDb();
  db[name] = rows;
  saveDb(db);
}
let idSeq = Date.now();

function pick(row: Row, cols: string | undefined): Row {
  if (!cols || cols.trim() === '*') return { ...row };
  const out: Row = {};
  for (const c of cols.split(',').map((s) => s.trim()).filter(Boolean)) out[c] = row[c] ?? null;
  return out;
}

class Query implements PromiseLike<{ data: any; error: any }> {
  private filters: Array<(r: Row) => boolean> = [];
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: any = null;
  private cols: string | undefined;
  private returning = false;
  private orderBy: { col: string; asc: boolean } | null = null;
  private max: number | null = null;
  private mode: 'many' | 'single' | 'maybe' = 'many';
  private opts: Row = {};
  constructor(private name: string) {}

  select(cols?: string) {
    if (this.op === 'select') this.cols = cols;
    else {
      this.returning = true;
      this.cols = cols;
    }
    return this;
  }
  insert(rows: Row | Row[]) {
    this.op = 'insert';
    this.payload = rows;
    return this;
  }
  update(vals: Row) {
    this.op = 'update';
    this.payload = vals;
    return this;
  }
  upsert(rows: Row | Row[], opts: Row = {}) {
    this.op = 'upsert';
    this.payload = rows;
    this.opts = opts;
    return this;
  }
  delete() {
    this.op = 'delete';
    return this;
  }
  eq(c: string, v: any) {
    this.filters.push((r) => r[c] === v);
    return this;
  }
  neq(c: string, v: any) {
    this.filters.push((r) => r[c] !== v);
    return this;
  }
  gt(c: string, v: any) {
    this.filters.push((r) => r[c] > v);
    return this;
  }
  gte(c: string, v: any) {
    this.filters.push((r) => r[c] >= v);
    return this;
  }
  lt(c: string, v: any) {
    this.filters.push((r) => r[c] < v);
    return this;
  }
  lte(c: string, v: any) {
    this.filters.push((r) => r[c] <= v);
    return this;
  }
  in(c: string, vs: any[]) {
    this.filters.push((r) => vs.includes(r[c]));
    return this;
  }
  is(c: string, v: any) {
    this.filters.push((r) => (r[c] ?? null) === v);
    return this;
  }
  not(c: string, op: string, v: any) {
    if (op === 'is') this.filters.push((r) => (r[c] ?? null) !== v);
    else this.filters.push((r) => r[c] !== v);
    return this;
  }
  order(col: string, o: { ascending?: boolean } = {}) {
    this.orderBy = { col, asc: o.ascending !== false };
    return this;
  }
  limit(n: number) {
    this.max = n;
    return this;
  }
  single() {
    this.mode = 'single';
    return this;
  }
  maybeSingle() {
    this.mode = 'maybe';
    return this;
  }
  private matches(r: Row) {
    return this.filters.every((f) => f(r));
  }

  private run(): { data: any; error: any } {
    let rows = table(this.name);
    let result: Row[] = [];
    if (this.op === 'select') {
      result = rows.filter((r) => this.matches(r));
    } else if (this.op === 'insert') {
      const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((r: Row) => ({ id: r.id ?? `row-${idSeq++}`, created_at: new Date().toISOString(), ...r }));
      rows = [...rows, ...list];
      writeTable(this.name, rows);
      result = list;
    } else if (this.op === 'update') {
      rows = rows.map((r) => (this.matches(r) ? ((result.push({ ...r, ...this.payload }), { ...r, ...this.payload })) : r));
      writeTable(this.name, rows);
    } else if (this.op === 'upsert') {
      if (this.name === 'base_games') {
        const refused = guardBaseSave(Array.isArray(this.payload) ? this.payload[0] : this.payload, rows);
        if (refused) return { data: null, error: refused };
      }
      const keys = ((this.opts.onConflict as string | undefined)?.split(',').map((s) => s.trim()) ?? UNIQUE[this.name] ?? ['id']);
      for (const item of Array.isArray(this.payload) ? this.payload : [this.payload]) {
        const i = rows.findIndex((r) => keys.every((k) => r[k] === item[k]));
        if (i >= 0) {
          if (!this.opts.ignoreDuplicates) rows[i] = { ...rows[i], ...item };
          result.push(rows[i]);
        } else {
          const row = { id: item.id ?? `row-${idSeq++}`, created_at: new Date().toISOString(), ...item };
          rows.push(row);
          result.push(row);
        }
      }
      writeTable(this.name, rows);
    } else if (this.op === 'delete') {
      result = rows.filter((r) => this.matches(r));
      writeTable(this.name, rows.filter((r) => !this.matches(r)));
    }
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      result = [...result].sort((a, b) => (a[col] < b[col] ? (asc ? -1 : 1) : a[col] > b[col] ? (asc ? 1 : -1) : 0));
    }
    if (this.max !== null) result = result.slice(0, this.max);
    if (this.op !== 'select' && !this.returning) return { data: null, error: null };
    const shaped = result.map((r) => pick(r, this.cols));
    if (this.mode === 'single') {
      return shaped.length === 1 ? { data: shaped[0], error: null } : { data: null, error: { message: `Expected 1 row, got ${shaped.length}`, code: 'PGRST116' } };
    }
    if (this.mode === 'maybe') return { data: shaped[0] ?? null, error: null };
    return { data: shaped, error: null };
  }

  then<A = { data: any; error: any }, B = never>(ok?: ((v: { data: any; error: any }) => A | PromiseLike<A>) | null, bad?: ((e: any) => B | PromiseLike<B>) | null): Promise<A | B> {
    const latency = Number(localStorage.getItem('2failure-demo-latency') || 60);
    const fail = this.op === 'select' ? null : flaky();
    return new Promise<{ data: any; error: any }>((res) =>
      setTimeout(() => {
        if (fail === 'before') return res(NETWORK_ERROR);
        const result = this.run();
        res(fail === 'after' ? NETWORK_ERROR : result);
      }, latency)
    ).then(ok, bad);
  }
}

// ---- auth ----
type Listener = (event: string, session: any) => void;
const listeners = new Set<Listener>();
let currentSession: any = (() => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
})();

function makeUser(email: string, fullName?: string) {
  return {
    id: 'demo-' + email.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    aud: 'authenticated',
    role: 'authenticated',
    email,
    user_metadata: fullName ? { full_name: fullName } : {},
    app_metadata: {},
    created_at: new Date().toISOString()
  };
}

/** What the real database trigger does on sign-up: a profile and a stats row. */
function seedUser(user: any) {
  const name = user.user_metadata?.full_name || (user.email ?? '').split('@')[0] || 'Athlete';
  const profiles = table('profiles');
  if (!profiles.some((p) => p.id === user.id)) {
    writeTable('profiles', [...profiles, { id: user.id, display_name: name, coins: 0, current_streak: 0, updated_at: new Date().toISOString() }]);
  }
  const stats = table('user_stats');
  if (!stats.some((s) => s.user_id === user.id)) {
    writeTable('user_stats', [
      ...stats,
      { user_id: user.id, current_streak: 0, longest_streak: 0, total_workouts: 0, last_workout_date: null, streak_restore_count: 0, streak_restore_month: null, updated_at: new Date().toISOString() }
    ]);
  }
}

async function startSession(user: any) {
  seedUser(user);
  currentSession = { access_token: 'demo', refresh_token: 'demo', expires_at: Math.floor(Date.now() / 1000) + 86400, user };
  localStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
  listeners.forEach((l) => l('SIGNED_IN', currentSession));
  return currentSession;
}

const auth = {
  async getSession() {
    return { data: { session: currentSession }, error: null };
  },
  async getUser() {
    return { data: { user: currentSession?.user ?? null }, error: null };
  },
  onAuthStateChange(cb: Listener) {
    listeners.add(cb);
    setTimeout(() => cb('INITIAL_SESSION', currentSession), 0);
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
  async signInWithPassword({ email }: { email: string; password: string }) {
    const session = await startSession(makeUser(email));
    return { data: { user: session.user, session }, error: null };
  },
  async signUp({ email, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
    const session = await startSession(makeUser(email, options?.data?.full_name));
    return { data: { user: session.user, session }, error: null };
  },
  async signInWithOAuth() {
    const session = await startSession(makeUser('demo.athlete@gmail.com', 'Demo Athlete'));
    return { data: { provider: 'google', url: null, session }, error: null };
  },
  async exchangeCodeForSession() {
    return { data: { session: currentSession }, error: null };
  },
  async signOut() {
    currentSession = null;
    localStorage.removeItem(SESSION_KEY);
    listeners.forEach((l) => l('SIGNED_OUT', null));
    return { error: null };
  }
};

/**
 * Server functions (same rules as supabase/migrations/20261026120000_server_coin_rewards.sql):
 * coins are earned for plausible sets and spent only with enough balance.
 */
/** The server's economy rules (20261027120000_server_economy.sql), same shared value logic. */
function budgetRow(db: Record<string, Row[]>, uid: string, existingBase?: Row) {
  const eco = (db.economy = db.economy ?? []);
  let row = eco.find((r) => r.user_id === uid);
  if (!row) {
    // Like the migration's backfill: an existing base starts with a budget covering it.
    row = { user_id: uid, material_budget: Math.max(STARTING_BUDGET, existingBase ? baseValue(existingBase.state ?? {}) : 0) };
    eco.push(row);
  }
  return row;
}
function guardBaseSave(item: Row, rows: Row[]): { code: string; message: string } | null {
  const db = loadDb();
  const existing = rows.find((r) => r.user_id === item.user_id);
  const row = budgetRow(db, item.user_id, existing);
  saveDb(db);
  const value = baseValue(item.state ?? {});
  return value > row.material_budget ? { code: 'P0001', message: `base_over_budget: base value ${value} exceeds earned budget ${row.material_budget}` } : null;
}

/**
 * Tests only: `localStorage['2failure-demo-flaky'] = '0.3'` makes 30% of writes
 * and server calls fail like a dropped connection, half before the server acts
 * and half after (the change is saved but the reply is lost).
 */
const NETWORK_ERROR = { data: null, error: { message: 'TypeError: Failed to fetch' } };
function flaky(): 'before' | 'after' | null {
  const p = Number(localStorage.getItem('2failure-demo-flaky') || 0);
  if (!p || Math.random() >= p) return null;
  return Math.random() < 0.5 ? 'before' : 'after';
}

function coinsForSet(seconds: number, tier: string): number {
  if (seconds < 10) return 0;
  return 20 + Math.round(10 * Math.min(1, seconds / 60)) + (tier === 'PRO' ? 5 : tier === 'ELITE' ? 10 : 0);
}
async function rpc(name: string, args: Record<string, any>) {
  const fail = flaky();
  if (fail === 'before') return NETWORK_ERROR;
  const result = await rpcInner(name, args);
  return fail === 'after' ? NETWORK_ERROR : result;
}
async function rpcInner(name: string, args: Record<string, any>) {
  const latency = Number(localStorage.getItem('2failure-demo-latency') || 60);
  await new Promise((r) => setTimeout(r, latency));
  const uid = currentSession?.user?.id;
  if (!uid) return { data: null, error: { code: '28000', message: 'not signed in' } };
  const db = loadDb();
  const profiles = db.profiles ?? [];
  const me = profiles.find((r) => r.id === uid);
  if (!me) return { data: null, error: { message: 'no profile' } };
  const ledger = (db.coin_ledger = db.coin_ledger ?? []);
  const now = Date.now();
  if (name === 'log_set_reward') {
    const seconds = Math.min(3600, Math.max(0, Math.round(args.p_seconds ?? 0)));
    const sets = ledger.filter((r) => r.user_id === uid && r.reason === 'set');
    const last = sets.length ? Math.max(...sets.map((r) => Date.parse(r.created_at))) : null;
    const today = sets.filter((r) => now - Date.parse(r.created_at) < 86400000).length;
    let earned = coinsForSet(seconds, args.p_tier);
    let reason = 'set';
    if (last !== null && now - last < Math.max(seconds, 5) * 1000) {
      earned = 0;
      reason = 'set_too_soon';
    } else if (today >= 80) {
      earned = 0;
      reason = 'set_daily_cap';
    }
    ledger.push({ id: now, user_id: uid, delta: earned, reason, meta: { category: args.p_category_id, seconds }, created_at: new Date(now).toISOString() });
    me.coins = (me.coins ?? 0) + earned;
    if (reason === 'set' && seconds >= 10) {
      const lastDay = last === null ? null : new Date(last).toISOString().slice(0, 10);
      const weekOf = (t: number) => Math.floor((t / 86400000 + 3) / 7); // Monday-based weeks
      const bonus = BUDGET_PER_SET + (lastDay !== new Date(now).toISOString().slice(0, 10) ? BUDGET_FIRST_OF_DAY : 0) + (last === null || weekOf(last) !== weekOf(now) ? BUDGET_FIRST_OF_WEEK : 0);
      budgetRow(db, uid, (db.base_games ?? []).find((r) => r.user_id === uid)).material_budget += bonus;
    }
    saveDb(db);
    return { data: [{ earned, balance: me.coins }], error: null };
  }
  if (name === 'log_set_entry') {
    const reps = Math.round(args.p_reps ?? 0);
    const kg = args.p_weight_kg;
    if (reps < 1 || reps > 1000) return { data: null, error: { message: 'implausible reps' } };
    if (kg != null && (kg <= 0 || kg > 500)) return { data: null, error: { message: 'implausible weight' } };
    const logs = (db.workout_set_logs = db.workout_set_logs ?? []);
    // The same set sent again (a retry after a lost reply): it's already saved.
    const again = args.p_client_id && logs.find((r) => r.user_id === uid && r.client_id === args.p_client_id);
    if (again) return { data: again.id, error: null };
    if (logs.some((r) => r.user_id === uid && now - Date.parse(r.completed_at) < 3000)) return { data: null, error: { message: 'too fast' } };
    const id = `log-${now}`;
    logs.push({ id, user_id: uid, category_id: args.p_category_id, reps, weight_kg: kg ?? null, set_number: args.p_set_number ?? null, client_id: args.p_client_id ?? null, completed_at: new Date(now).toISOString() });
    saveDb(db);
    return { data: id, error: null };
  }
  if (name === 'demo_add_budget') {
    budgetRow(db, uid, (db.base_games ?? []).find((r) => r.user_id === uid)).material_budget += Math.round(args.p_amount ?? 0);
    saveDb(db);
    return { data: null, error: null };
  }
  if (name === 'spend_coins') {
    const amount = Math.round(args.p_amount ?? 0);
    if (amount <= 0) return { data: null, error: { message: 'invalid amount' } };
    if ((me.coins ?? 0) < amount) return { data: null, error: { code: 'P0001', message: 'not enough coins' } };
    me.coins -= amount;
    ledger.push({ id: now, user_id: uid, delta: -amount, reason: args.p_reason ?? 'spend', meta: {}, created_at: new Date(now).toISOString() });
    saveDb(db);
    return { data: me.coins, error: null };
  }
  // ---- Social (same rules as 20261101120000_social.sql) ----
  const social = socialRpc(db, uid, name, args);
  if (social) {
    saveDb(db);
    return social;
  }
  return { data: null, error: { code: 'PGRST202', message: `Could not find the function ${name}` } };
}

/** Demo friends: two players with real-looking bases and training this week. */
const BOTS = [
  {
    id: 'bot-maya',
    name: 'Maya',
    code: 'MAYA42',
    streak: 12,
    sets: 24,
    base: {
      version: 3,
      resources: { stone: 60, timber: 40, crystal: 80 },
      landLevel: 3,
      placed: [
        { uid: 'm1', itemId: 'hq', x: 8, y: 8, level: 5 },
        { uid: 'm2', itemId: 'lodge', x: 11, y: 7, level: 4 },
        { uid: 'm3', itemId: 'watchtower', x: 6, y: 6, level: 4 },
        { uid: 'm4', itemId: 'watchtower', x: 12, y: 11, level: 3 },
        { uid: 'm5', itemId: 'spring', x: 6, y: 10, level: 3 },
        { uid: 'm6', itemId: 'forge', x: 11, y: 10, level: 2 },
        { uid: 'm7', itemId: 'fountain', x: 9, y: 12, level: 1, style: 'tiered' },
        { uid: 'm8', itemId: 'arch', x: 8, y: 11, level: 1 },
        { uid: 'm9', itemId: 'flowers', x: 7, y: 11, level: 1 },
        { uid: 'm10', itemId: 'flowers', x: 10, y: 11, level: 1, color: 'violet' },
        { uid: 'm11', itemId: 'pine', x: 5, y: 8, level: 1 },
        { uid: 'm12', itemId: 'pine', x: 13, y: 8, level: 1 },
        { uid: 'm13', itemId: 'lanterns', x: 10, y: 6, level: 1 },
        { uid: 'm14', itemId: 'pullupbar', x: 7, y: 6, level: 1 },
        { uid: 'm15', itemId: 'campfire', x: 12, y: 13, level: 1 }
      ],
      constructions: [],
      terrain: Object.fromEntries([...Array(7).keys()].map((i) => [`${7 + i},10`, 'path']).concat([[`8,13`, 'path'], [`9,13`, 'path'], [`4,12`, 'water'], [`5,12`, 'water'], [`4,13`, 'water']])),
      stats: { totalSets: 220 },
      trophies: {},
      unseen: [],
      nextUid: 50
    }
  },
  {
    id: 'bot-omar',
    name: 'Omar',
    code: 'OMAR77',
    streak: 4,
    sets: 12,
    base: {
      version: 3,
      resources: { stone: 30, timber: 50, crystal: 40 },
      landLevel: 2,
      placed: [
        { uid: 'o1', itemId: 'hq', x: 8, y: 8, level: 3 },
        { uid: 'o2', itemId: 'lodge', x: 11, y: 8, level: 2 },
        { uid: 'o3', itemId: 'barn', x: 6, y: 10, level: 1 },
        { uid: 'o4', itemId: 'coop', x: 9, y: 11, level: 1 },
        { uid: 'o5', itemId: 'windmill', x: 12, y: 11, level: 1 },
        { uid: 'o6', itemId: 'pumpkins', x: 7, y: 7, level: 1 },
        { uid: 'o7', itemId: 'well', x: 11, y: 11, level: 1 },
        { uid: 'o8', itemId: 'beehive', x: 6, y: 8, level: 1 }
      ],
      constructions: [],
      terrain: { '8,10': 'path', '9,10': 'path', '10,10': 'path', '10,11': 'path' },
      stats: { totalSets: 90 },
      trophies: {},
      unseen: [],
      nextUid: 20
    }
  },
  {
    id: 'bot-noa',
    name: 'Noa',
    code: 'NOA555',
    streak: 21,
    sets: 30,
    base: {
      version: 3,
      resources: { stone: 90, timber: 70, crystal: 120 },
      landLevel: 3,
      placed: [
        { uid: 'n1', itemId: 'hq', x: 8, y: 8, level: 6 },
        { uid: 'n2', itemId: 'lodge', x: 11, y: 7, level: 5 },
        { uid: 'n3', itemId: 'yard', x: 5, y: 7, level: 4 },
        { uid: 'n4', itemId: 'pullupbar', x: 11, y: 10, level: 1 },
        { uid: 'n5', itemId: 'dipbars', x: 12, y: 10, level: 1 },
        { uid: 'n6', itemId: 'punchbag', x: 11, y: 11, level: 1 },
        { uid: 'n7', itemId: 'plyobox', x: 12, y: 11, level: 1 },
        { uid: 'n8', itemId: 'statue', x: 9, y: 11, level: 1, style: 'runner' },
        { uid: 'n9', itemId: 'banner', x: 7, y: 11, level: 1, style: 'chevron' },
        { uid: 'n10', itemId: 'campfire', x: 8, y: 13, level: 1 }
      ],
      constructions: [],
      terrain: { '8,10': 'path', '9,10': 'path', '10,10': 'path', '8,11': 'path', '8,12': 'path' },
      stats: { totalSets: 400 },
      trophies: {},
      unseen: [],
      nextUid: 20
    }
  },
  {
    id: 'bot-eli',
    name: 'Eli',
    code: 'ELI808',
    streak: 2,
    sets: 6,
    base: {
      version: 3,
      resources: { stone: 20, timber: 20, crystal: 15 },
      landLevel: 1,
      placed: [
        { uid: 'e1', itemId: 'hq', x: 8, y: 8, level: 2 },
        { uid: 'e2', itemId: 'lodge', x: 10, y: 9, level: 1 },
        { uid: 'e3', itemId: 'tent', x: 7, y: 10, level: 1 },
        { uid: 'e4', itemId: 'pine', x: 10, y: 7, level: 1 },
        { uid: 'e5', itemId: 'torch', x: 9, y: 10, level: 1 }
      ],
      constructions: [],
      terrain: {},
      stats: { totalSets: 30 },
      trophies: {},
      unseen: [],
      nextUid: 10
    }
  }
];

function weekStartMs(now: number): number {
  const d = new Date(now);
  const day = (d.getUTCDay() + 6) % 7; // Monday first
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
}

function socialRpc(db: Record<string, Row[]>, uid: string, name: string, args: Record<string, any>) {
  const SOCIAL = new Set(['my_friend_code', 'send_friend_request', 'respond_friend_request', 'remove_friend', 'friends_overview', 'get_friend_base', 'cheer_friend', 'squad_status', 'claim_squad_reward', 'create_squad', 'invite_to_squad', 'my_squad_invites', 'respond_squad_invite', 'leave_squad', 'squad_members_status']);
  if (!SOCIAL.has(name)) return null;
  const now = Date.now();
  const profiles = (db.profiles = db.profiles ?? []);
  const me = profiles.find((r) => r.id === uid)!;
  const friendships = (db.friendships = db.friendships ?? []);
  const cheers = (db.cheers = db.cheers ?? []);
  const claims = (db.squad_claims = db.squad_claims ?? []);
  const logs = (db.workout_set_logs = db.workout_set_logs ?? []);
  // Seed the demo friends once per player (Omar sends you a request).
  if (!me.friend_code) {
    me.friend_code = uid.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase().padStart(6, 'X');
    for (const bot of BOTS) {
      if (!profiles.some((r) => r.id === bot.id)) {
        profiles.push({ id: bot.id, display_name: bot.name, coins: 0, current_streak: bot.streak, friend_code: bot.code });
        (db.user_stats = db.user_stats ?? []).push({ user_id: bot.id, current_streak: bot.streak, longest_streak: bot.streak, total_workouts: 40 });
        (db.base_games = db.base_games ?? []).push({ user_id: bot.id, state: bot.base, version: 3 });
      }
      const start = weekStartMs(now);
      if (!logs.some((r) => r.user_id === bot.id && Date.parse(r.completed_at) >= start)) {
        for (let k = 0; k < bot.sets; k++) {
          logs.push({ id: `${bot.id}-${k}`, user_id: bot.id, category_id: 'pushups', reps: 12, completed_at: new Date(start + 3600000 + k * 60000).toISOString() });
        }
      }
    }
    const pair = (a: string, b: string) => (a < b ? [a, b] : [b, a]);
    const [a, b] = pair(uid, 'bot-omar');
    if (!friendships.some((f) => f.user_a === a && f.user_b === b)) friendships.push({ user_a: a, user_b: b, requested_by: 'bot-omar', status: 'pending' });
  }
  const pairOf = (other: string) => (uid < other ? { a: uid, b: other } : { a: other, b: uid });
  const rowWith = (other: string) => {
    const { a, b } = pairOf(other);
    return friendships.find((f) => f.user_a === a && f.user_b === b);
  };
  const friendIds = () => friendships.filter((f) => f.status === 'accepted' && (f.user_a === uid || f.user_b === uid)).map((f) => (f.user_a === uid ? f.user_b : f.user_a));
  const setsThisWeek = (id: string) => logs.filter((r) => r.user_id === id && Date.parse(r.completed_at) >= weekStartMs(now)).length;
  const today = new Date(now).toISOString().slice(0, 10);
  const ok = (data: unknown) => ({ data, error: null });
  const fail = (message: string) => ({ data: null, error: { code: 'P0001', message } });
  // Squads you pick (one per person per week; up to 4 people).
  const week = new Date(weekStartMs(now)).toISOString().slice(0, 10);
  const squadMembersTable = (db.squad_members = db.squad_members ?? []);
  const mySquadId = () => squadMembersTable.find((m) => m.user_id === uid && m.week_start === week && m.status === 'joined')?.squad_id ?? null;
  const nameOf = (id: string) => profiles.find((r) => r.id === id)?.display_name || 'Athlete';
  const squad = () => {
    const id = mySquadId();
    const joined = id ? squadMembersTable.filter((m) => m.squad_id === id && m.status === 'joined').map((m) => m.user_id) : [];
    return {
      squad_id: id,
      goal: joined.length >= 2 ? 30 * joined.length : 0,
      total: joined.reduce((n, m) => n + setsThisWeek(m), 0),
      my_sets: setsThisWeek(uid),
      members: joined.length,
      claimed: claims.some((c) => c.user_id === uid && c.week_start === week),
      week
    };
  };
  // In the demo, invited friends join right away (if they're free).
  const invite = (squadId: string, friend: string) => {
    if (squadMembersTable.some((m) => m.squad_id === squadId && m.user_id === friend)) return;
    const busy = friend.startsWith('bot-') && squadMembersTable.some((m) => m.user_id === friend && m.week_start === week && m.status === 'joined');
    squadMembersTable.push({ squad_id: squadId, user_id: friend, week_start: week, status: friend.startsWith('bot-') && !busy ? 'joined' : 'invited', invited_by: uid });
  };

  switch (name) {
    case 'my_friend_code':
      return ok(me.friend_code);
    case 'send_friend_request': {
      const code = String(args.p_code ?? '').trim().toUpperCase();
      const other = profiles.find((r) => r.friend_code === code);
      if (!other) return ok('not_found');
      if (other.id === uid) return ok('self');
      const row = rowWith(other.id);
      if (row) {
        if (row.status === 'accepted') return ok('already');
        if (row.requested_by === uid) return ok('pending');
        row.status = 'accepted';
        return ok('accepted');
      }
      const { a, b } = pairOf(other.id);
      // The demo friends accept right away.
      friendships.push({ user_a: a, user_b: b, requested_by: uid, status: other.id.startsWith('bot-') ? 'accepted' : 'pending' });
      return ok(other.id.startsWith('bot-') ? 'accepted' : 'sent');
    }
    case 'respond_friend_request': {
      const row = rowWith(args.p_friend);
      if (row && row.status === 'pending' && row.requested_by === args.p_friend) {
        if (args.p_accept) row.status = 'accepted';
        else friendships.splice(friendships.indexOf(row), 1);
      }
      return ok(null);
    }
    case 'remove_friend': {
      const row = rowWith(args.p_friend);
      if (row) friendships.splice(friendships.indexOf(row), 1);
      return ok(null);
    }
    case 'friends_overview':
      return ok(
        friendships
          .filter((f) => f.user_a === uid || f.user_b === uid)
          .map((f) => {
            const id = f.user_a === uid ? f.user_b : f.user_a;
            const p = profiles.find((r) => r.id === id);
            const accepted = f.status === 'accepted';
            const base = (db.base_games ?? []).find((r) => r.user_id === id)?.state;
            const hq = (base?.placed ?? []).find((it: Row) => it.itemId === 'hq')?.level ?? 1;
            const stats = (db.user_stats ?? []).find((r) => r.user_id === id);
            return {
              friend_id: id,
              display_name: p?.display_name || 'Athlete',
              status: f.status,
              incoming: f.status === 'pending' && f.requested_by !== uid,
              current_streak: accepted ? stats?.current_streak ?? 0 : 0,
              hq_level: accepted ? hq : 0,
              sets_this_week: accepted ? setsThisWeek(id) : 0,
              cheered_today: cheers.some((c) => c.from_user === uid && c.to_user === id && c.day === today)
            };
          })
      );
    case 'get_friend_base': {
      if (!friendIds().includes(args.p_friend)) return fail('not_friends');
      return ok((db.base_games ?? []).find((r) => r.user_id === args.p_friend)?.state ?? {});
    }
    case 'cheer_friend': {
      if (!friendIds().includes(args.p_friend)) return ok('not_friends');
      if (cheers.some((c) => c.from_user === uid && c.to_user === args.p_friend && c.day === today)) return ok('already');
      cheers.push({ from_user: uid, to_user: args.p_friend, day: today });
      const p = profiles.find((r) => r.id === args.p_friend);
      if (p) p.coins = (p.coins ?? 0) + 5;
      return ok('cheered');
    }
    case 'squad_status': {
      const s = squad();
      return ok([{ squad_id: s.squad_id, goal: s.goal, total: s.total, my_sets: s.my_sets, members: s.members, claimed: s.claimed }]);
    }
    case 'squad_members_status': {
      const id = mySquadId();
      if (!id) return ok([]);
      return ok(
        squadMembersTable
          .filter((m) => m.squad_id === id)
          .map((m) => ({ user_id: m.user_id, display_name: nameOf(m.user_id), status: m.status, sets_this_week: setsThisWeek(m.user_id), is_me: m.user_id === uid }))
          .sort((a, b) => Number(b.is_me) - Number(a.is_me) || Number(b.status === 'joined') - Number(a.status === 'joined') || a.display_name.localeCompare(b.display_name))
      );
    }
    case 'my_squad_invites':
      return ok(
        squadMembersTable
          .filter((m) => m.user_id === uid && m.status === 'invited' && m.week_start === week)
          .map((m) => ({
            squad_id: m.squad_id,
            from_name: nameOf(m.invited_by),
            members: squadMembersTable.filter((x) => x.squad_id === m.squad_id && x.status === 'joined').map((x) => nameOf(x.user_id))
          }))
      );
    case 'create_squad': {
      const friends: string[] = args.p_friends ?? [];
      if (mySquadId()) return fail('already_in_squad');
      if (friends.length < 1 || friends.length > 3) return fail('pick_1_to_3');
      if (friends.some((f) => !friendIds().includes(f))) return fail('not_friends');
      const id = `squad-${now}`;
      squadMembersTable.push({ squad_id: id, user_id: uid, week_start: week, status: 'joined' });
      for (const f of friends) invite(id, f);
      return ok(id);
    }
    case 'invite_to_squad': {
      const id = mySquadId();
      if (!id) return ok('no_squad');
      if (!friendIds().includes(args.p_friend)) return ok('not_friends');
      if (squadMembersTable.filter((m) => m.squad_id === id).length >= 4) return ok('full');
      invite(id, args.p_friend);
      return ok('invited');
    }
    case 'respond_squad_invite': {
      const row = squadMembersTable.find((m) => m.squad_id === args.p_squad && m.user_id === uid && m.status === 'invited');
      if (!row) return ok('no_invite');
      if (!args.p_accept) {
        squadMembersTable.splice(squadMembersTable.indexOf(row), 1);
        return ok('declined');
      }
      if (mySquadId()) return ok('already_in_squad');
      row.status = 'joined';
      return ok('joined');
    }
    case 'leave_squad': {
      const id = mySquadId();
      const row = squadMembersTable.find((m) => m.squad_id === id && m.user_id === uid);
      if (row) squadMembersTable.splice(squadMembersTable.indexOf(row), 1);
      return ok(null);
    }
    case 'claim_squad_reward': {
      const s = squad();
      if (!s.squad_id || s.members < 2) return fail('no_squad');
      if (s.total < s.goal) return fail('not_done');
      if (s.my_sets < 10) return fail('too_few_sets');
      if (s.claimed) return fail('claimed');
      claims.push({ user_id: uid, week_start: week, coins: 300 });
      me.coins = (me.coins ?? 0) + 300;
      budgetRow(db, uid, (db.base_games ?? []).find((r) => r.user_id === uid)).material_budget += 120;
      return ok([{ coins: 300, balance: me.coins }]);
    }
  }
  return null;
}

export function createClient() {
  const client = { from: (name: string) => new Query(name), auth, rpc };
  // Demo only: lets tests call the same server functions a cheater could call.
  (window as unknown as { __supabaseForTests?: unknown }).__supabaseForTests = client;
  return client;
}
