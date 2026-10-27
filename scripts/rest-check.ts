import { restFitsWeeks, weekStartOf, weekState } from '../src/lib/restWeek';

// Week of Monday 2026-10-26 (Monday-first). Plan: 5 days → 2 rest days.
const D = (n: number) => `2026-10-${String(26 + n).padStart(2, '0')}`; // 0 = Mon … 6 = Sun
const set = (...days: string[]) => new Set(days);
let failed = 0;
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
}
const ws = (today: string, trained: string[], rest: string[] = [], planDays = 5, sundayFirst = false) =>
  weekState({ today, planDays, trainedDays: set(...trained), declaredRest: set(...rest), sundayFirst });

let s = ws(D(0), []);
check('Mon, fresh week: 2 rest days left, can rest', [s.restLeft, s.canRestToday], [2, true]);

s = ws(D(5), [D(0), D(1), D(2), D(3), D(4)]);
check('Sat after Mon–Fri trained: week done, today is rest automatically', [s.weekDone, s.restToday, s.restTodayIsWeekDone, s.canRestToday], [true, true, true, false]);

s = ws(D(2), [], [D(0)]);
check('Wed, rested Mon (ticket) and skipped Tue: no rest left, must train', [s.restUsed, s.restLeft, s.canRestToday, s.trainingLeft], [2, 0, false, 5]);

s = ws(D(2), []);
check('Wed, skipped Mon + Tue (no ticket): counted the same as rest', [s.restUsed, s.restLeft, s.canRestToday], [2, 0, false]);

s = ws(D(3), [D(0), D(1), D(2)]);
check('Thu after 3 trained: 2 left, can rest', [s.restLeft, s.canRestToday], [2, true]);

s = ws(D(5), [D(0), D(1), D(2), D(3)]);
check('Sat, 4 trained, Fri off: 1 left, can rest (Sun can fit the last session)', [s.restUsed, s.restLeft, s.canRestToday], [1, 1, true]);

s = ws(D(6), [D(0), D(1), D(2), D(3)]);
check('Sun, 4 trained, Fri + Sat off: must train (no rest left)', [s.restUsed, s.restLeft, s.canRestToday], [2, 0, false]);

s = ws(D(4), [D(0), D(1)]);
check('Fri, 2 trained, Wed + Thu off: 0 left (3 sessions, 3 days)', [s.restLeft, s.canRestToday], [0, false]);

s = ws(D(2), [D(0), D(1), D(2)]);
check('Wed after training today: today counts as trained, not rest', [s.trained, s.restToday, s.canRestToday], [3, false, false]);

s = ws(D(1), [], [D(1)]);
check('Tue, ticket torn today: today is rest, 1 used + Mon off = 2', [s.restToday, s.restUsed], [true, 2]);

s = ws(D(3), [D(0), D(1), D(2)], [], 3);
check('3-day plan, done by Wed: Thu is rest automatically', [s.weekDone, s.restToday], [true, true]);

s = weekState({ today: D(1), planDays: 5, trainedDays: set(), declaredRest: set(), sundayFirst: false, planStart: D(1) });
check('Joined Tue: Mon before joining is not a used rest day', [s.restUsed, s.restLeft, s.canRestToday], [0, 2, true]);

s = weekState({ today: D(3), planDays: 5, trainedDays: set(), declaredRest: set(), sundayFirst: false, planStart: D(3) });
check('Joined Thu (4 days left): target shrinks to 2, 2 rest days', [s.planDays, s.trainingLeft, s.restLeft, s.canRestToday], [2, 2, 2, true]);

s = weekState({ today: D(5), planDays: 5, trainedDays: set(), declaredRest: set(), sundayFirst: false, planStart: D(5) });
check('Joined Sat: still 1 session to do, not forced to rest', [s.planDays, s.weekDone, s.restToday], [1, false, false]);

check('Week start, Monday-first', weekStartOf('2026-10-29', false), '2026-10-26');
check('Week start, Sunday-first (Hebrew/Arabic)', weekStartOf('2026-10-29', true), '2026-10-25');

check(
  'Streak: rest Sat+Sun, then Mon+Tue next week (2 a week) is fine',
  restFitsWeeks({ lastWorkoutDate: '2026-10-23', today: '2026-10-28', allowance: 2, knownRest: [], sundayFirst: false }),
  true
);
check(
  'Streak: 3 days off in one week with 2 allowed breaks it',
  restFitsWeeks({ lastWorkoutDate: '2026-10-26', today: '2026-10-30', allowance: 2, knownRest: [], sundayFirst: false }),
  false
);
check(
  'Streak: earlier rest that week counts too (1 known + 2 skipped > 2)',
  restFitsWeeks({ lastWorkoutDate: '2026-10-28', today: '2026-10-31', allowance: 2, knownRest: ['2026-10-26'], sundayFirst: false }),
  false
);

console.log(failed ? `\n${failed} FAILED` : '\nREST OK');
process.exit(failed ? 1 : 0);
