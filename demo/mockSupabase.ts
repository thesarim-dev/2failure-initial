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
    return new Promise<{ data: any; error: any }>((res) => setTimeout(() => res(this.run()), latency)).then(ok, bad);
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
function coinsForSet(seconds: number, tier: string): number {
  if (seconds < 10) return 0;
  return 20 + Math.round(10 * Math.min(1, seconds / 60)) + (tier === 'PRO' ? 5 : tier === 'ELITE' ? 10 : 0);
}
async function rpc(name: string, args: Record<string, any>) {
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
    saveDb(db);
    return { data: [{ earned, balance: me.coins }], error: null };
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
  return { data: null, error: { code: 'PGRST202', message: `Could not find the function ${name}` } };
}

export function createClient() {
  const client = { from: (name: string) => new Query(name), auth, rpc };
  // Demo only: lets tests call the same server functions a cheater could call.
  (window as unknown as { __supabaseForTests?: unknown }).__supabaseForTests = client;
  return client;
}
