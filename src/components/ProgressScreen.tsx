import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Medal, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchSetHistory, type SetLogRow } from '../lib/setHistory';
import { toLocalDateString } from '../lib/userStats';
import { getLineupSlot } from './moves';

type Session = { day: string; best: number; reps: number; weight: number | null };
type Record_ = { id: string; day: string; value: number; weighted: boolean; reps: number };

const DAY = 86400000;
const weekStart = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (x.getDay() + 6) % 7; // Monday first
  return new Date(x.getTime() - offset * DAY);
};

/** Turns raw set logs into what the screen shows. */
function analyse(rows: SetLogRow[]) {
  const perDay = new Map<string, number>();
  const byExercise = new Map<string, Session[]>();
  const records: Record_[] = [];
  const best = new Map<string, number>();
  for (const r of rows) {
    const day = toLocalDateString(new Date(r.completed_at));
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
    const weighted = !!(r.weight_kg && r.weight_kg > 0);
    const value = weighted ? Number(r.weight_kg) : r.reps;
    const list = byExercise.get(r.category_id) ?? [];
    const last = list[list.length - 1];
    if (last && last.day === day) {
      if (value > last.best || (value === last.best && r.reps > last.reps)) Object.assign(last, { best: value, reps: r.reps, weight: weighted ? value : null });
    } else list.push({ day, best: value, reps: r.reps, weight: weighted ? value : null });
    byExercise.set(r.category_id, list);
    // A personal record: beating your previous best for that exercise.
    const prev = best.get(r.category_id);
    if (prev !== undefined && value > prev) records.push({ id: r.category_id, day, value, weighted, reps: r.reps });
    if (prev === undefined || value > prev) best.set(r.category_id, value);
  }
  return { perDay, byExercise, records: records.reverse() };
}

function Sparkline({ values, big = false }: { values: number[]; big?: boolean }) {
  const w = big ? 300 : 96;
  const h = big ? 120 : 30;
  const pad = big ? 10 : 3;
  if (values.length < 2) return <svg width={w} height={h} aria-hidden="true" />;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [pad + (i / (values.length - 1)) * (w - pad * 2), h - pad - ((v - lo) / span) * (h - pad * 2)] as const);
  const line = pts.map((p) => p.join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={big ? '100%' : w} height={h} className="progress-spark" aria-hidden="true">
      <polygon points={`${pad},${h - pad} ${line} ${w - pad},${h - pad}`} className="progress-spark-fill" />
      <polyline points={line} className="progress-spark-line" />
      {big && pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} className="progress-spark-dot" />)}
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={big ? 4.5 : 2.8} className="progress-spark-end" />
    </svg>
  );
}

export function ProgressScreen({
  userId,
  streak,
  restDays,
  refreshKey
}: {
  userId: string;
  streak: number;
  restDays: string[];
  /** Changes when a set is logged, so the screen refreshes. */
  refreshKey: number;
}) {
  const { t, language } = useLanguage();
  const p = t.progress;
  const [rows, setRows] = useState<SetLogRow[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetchSetHistory(userId)
      .then((r) => alive && setRows(r))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [userId, refreshKey]);

  const data = useMemo(() => (rows ? analyse(rows) : null), [rows]);
  const fmtDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(language, { month: 'short', day: 'numeric' });
  const name = (id: string) => t.moves.variants[id]?.name ?? id;

  if (!data) return <div className="progress-screen"><p className="progress-loading">…</p></div>;

  const today = new Date();
  const todayKey = toLocalDateString(today);
  const thisWeek = weekStart(today);
  const setsThisWeek = [...data.perDay.entries()].filter(([d]) => new Date(`${d}T12:00:00`) >= thisWeek).reduce((a, [, n]) => a + n, 0);
  const monthAgo = toLocalDateString(new Date(today.getTime() - 30 * DAY));
  const newRecords = data.records.filter((r) => r.day >= monthAgo).length;

  // 12-week heatmap, Monday-first columns.
  const start = new Date(thisWeek.getTime() - 11 * 7 * DAY);
  const rest = new Set(restDays);
  const cells = Array.from({ length: 12 * 7 }, (_, i) => {
    const d = new Date(start.getTime() + i * DAY);
    const key = toLocalDateString(d);
    const n = data.perDay.get(key) ?? 0;
    const level = d > today ? -1 : n === 0 ? 0 : n <= 3 ? 1 : n <= 7 ? 2 : 3;
    return { key, n, level, rest: rest.has(key), today: key === todayKey, col: Math.floor(i / 7), row: i % 7 };
  });

  // Weekly sets by body area, last 8 weeks.
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const from = new Date(thisWeek.getTime() - (7 - i) * 7 * DAY);
    return { from, upper: 0, lower: 0, core: 0 };
  });
  for (const r of rows ?? []) {
    const d = new Date(r.completed_at);
    const idx = weeks.findIndex((w, i) => d >= w.from && (i === weeks.length - 1 || d < weeks[i + 1].from));
    if (idx < 0) continue;
    const slot = getLineupSlot(r.category_id);
    if (slot === 'upper' || slot === 'lower' || slot === 'core') weeks[idx][slot] += 1;
  }
  const maxWeek = Math.max(4, ...weeks.map((w) => w.upper + w.lower + w.core));

  const exercises = [...data.byExercise.entries()].sort((a, b) => b[1][b[1].length - 1].day.localeCompare(a[1][a[1].length - 1].day));

  if (!rows?.length) {
    return (
      <div className="progress-screen">
        <h1 className="progress-title">{p.title}</h1>
        <section className="cyber-panel progress-empty">
          <TrendingUp size={36} strokeWidth={2.2} aria-hidden="true" />
          <p>{p.empty}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="progress-screen">
      <h1 className="progress-title">{p.title}</h1>
      <div className="progress-tiles">
        {[
          [setsThisWeek, p.thisWeek],
          [streak, p.streak],
          [rows.length, p.allTime],
          [newRecords, p.newRecords]
        ].map(([n, label]) => (
          <div key={String(label)} className="progress-tile">
            <span className="progress-tile-n tabular-nums">{n}</span>
            <span className="progress-tile-label">{label}</span>
          </div>
        ))}
      </div>

      <section className="cyber-panel progress-card">
        <h2 className="progress-h2">{p.calendar}</h2>
        <svg viewBox={`0 0 ${12 * 16} ${7 * 16}`} className="progress-heat" role="img" aria-label={p.calendar}>
          {cells.map((c) => (
            <rect
              key={c.key}
              x={c.col * 16 + 1}
              y={c.row * 16 + 1}
              width={13}
              height={13}
              rx={3}
              className={`heat-cell heat-${c.level < 0 ? 'future' : c.level} ${c.rest && c.n === 0 ? 'is-rest' : ''} ${c.today ? 'is-today' : ''}`}>
              <title>{`${fmtDay(c.key)}: ${p.sets(c.n)}`}</title>
            </rect>
          ))}
        </svg>
        <div className="progress-legend">
          <span>{p.less}</span>
          {[0, 1, 2, 3].map((l) => (
            <i key={l} className={`heat-cell heat-${l}`} />
          ))}
          <span>{p.more}</span>
          <i className="heat-cell is-rest" />
          <span>{p.restDay}</span>
        </div>
      </section>

      <section className="cyber-panel progress-card">
        <h2 className="progress-h2">{p.weekly}</h2>
        <div className="progress-weeks">
          {weeks.map((w, i) => {
            const total = w.upper + w.lower + w.core;
            return (
              <div key={i} className="progress-week">
                <span className="progress-week-n tabular-nums">{total || ''}</span>
                <div className="progress-week-bar" style={{ height: '6.5rem' }}>
                  {(['core', 'lower', 'upper'] as const).map((k) => (
                    <i key={k} className={`week-${k}`} style={{ height: `${(w[k] / maxWeek) * 100}%` }} />
                  ))}
                </div>
                <span className="progress-week-label">{w.from.toLocaleDateString(language, { day: 'numeric', month: 'numeric' })}</span>
              </div>
            );
          })}
        </div>
        <div className="progress-legend">
          <i className="week-upper" />
          <span>{p.upper}</span>
          <i className="week-lower" />
          <span>{p.legs}</span>
          <i className="week-core" />
          <span>{p.core}</span>
        </div>
      </section>

      <section className="cyber-panel progress-card">
        <h2 className="progress-h2">{p.exercises}</h2>
        <ul className="progress-list">
          {exercises.map(([id, sessions]) => {
            const lastS = sessions[sessions.length - 1];
            const first = sessions[0];
            const peak = sessions.reduce((a, s) => (s.best > a.best ? s : a), sessions[0]);
            const delta = lastS.best - first.best;
            const isOpen = open === id;
            return (
              <li key={id} className={`progress-ex ${isOpen ? 'is-open' : ''}`}>
                <button type="button" className="progress-ex-row" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}>
                  <span className="progress-ex-text">
                    <span className="progress-ex-name">{name(id)}</span>
                    <span className="progress-ex-best">{peak.weight ? p.bestWeight(peak.weight, peak.reps) : p.bestReps(peak.best)}</span>
                  </span>
                  {sessions.length > 1 && delta > 0 && <span className="progress-ex-delta">{peak.weight ? p.kgMore(delta) : `+${delta}`}</span>}
                  <Sparkline values={sessions.map((s) => s.best)} />
                  <ChevronDown size={16} className="progress-ex-chev" aria-hidden="true" />
                </button>
                {isOpen && (
                  <div className="progress-ex-chart">
                    {sessions.length > 1 ? <Sparkline values={sessions.map((s) => s.best)} big /> : <p className="progress-ex-note">{p.oneSession}</p>}
                    <div className="progress-ex-axis">
                      <span>{fmtDay(first.day)}</span>
                      <span>{p.sessions(sessions.length)}</span>
                      <span>{fmtDay(lastS.day)}</span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {data.records.length > 0 && (
        <section className="cyber-panel progress-card">
          <h2 className="progress-h2">{p.records}</h2>
          <ul className="progress-records">
            {data.records.slice(0, 8).map((r, i) => (
              <li key={i}>
                <Medal size={16} strokeWidth={2.4} aria-hidden="true" />
                <span className="progress-rec-name">{name(r.id)}</span>
                <span className="progress-rec-value">{r.weighted ? p.bestWeight(r.value, r.reps) : p.bestReps(r.value)}</span>
                <span className="progress-rec-day">{fmtDay(r.day)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
