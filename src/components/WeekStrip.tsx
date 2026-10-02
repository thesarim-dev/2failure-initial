import { BedDouble, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { STREAK_MIN_SETS_PER_DAY, toLocalDateString } from '../lib/userStats';

/**
 * "This week": Monday to Sunday, ticking off training days, marking rest days
 * and ringing today, with progress toward the weekly target.
 */

function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function WeekStrip({
  weekTrainingDays,
  recentRestDays,
  isRestDayToday,
  totalSetsToday,
  weeklyTarget,
  compact = false
}: {
  /** App days (YYYY-MM-DD) trained this week. */
  weekTrainingDays: string[];
  recentRestDays: string[];
  isRestDayToday: boolean;
  totalSetsToday: number;
  weeklyTarget: number;
  /** Tighter layout for sitting beside the streak flame. */
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const w = t.hub.week;
  const today = toLocalDateString();
  const [y, m, d] = today.split('-').map(Number);
  const monday = shiftDay(today, -((new Date(y, m - 1, d).getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
  const trained = new Set(weekTrainingDays);
  const rested = new Set(recentRestDays);
  const trainedToday = totalSetsToday >= STREAK_MIN_SETS_PER_DAY;
  const count = week.filter((day) => trained.has(day) || (day === today && trainedToday)).length;

  return (
    <section className={`home-week normal-case ${compact ? 'is-compact' : ''}`} aria-labelledby="week-strip-title">
      <div className="home-section-head">
        <h2 id="week-strip-title" className="home-section-title">
          {w.title}
        </h2>
        <span className="home-section-meta">{w.line(Math.min(count, weeklyTarget), weeklyTarget)}</span>
      </div>
      <ol className="home-week-days">
        {week.map((day, i) => {
          const isToday = day === today;
          const didTrain = trained.has(day) || (isToday && trainedToday);
          const didRest = !didTrain && (rested.has(day) || (isToday && isRestDayToday));
          return (
            <li key={day} className={`home-day ${didTrain ? 'is-trained' : ''} ${didRest ? 'is-rest' : ''} ${isToday ? 'is-today' : ''}`}>
              <span className="home-day-letter">{w.days[i]}</span>
              <span className="home-day-mark" aria-hidden="true">
                {didTrain ? <Check size={14} strokeWidth={3.5} /> : didRest ? <BedDouble size={13} strokeWidth={2.5} /> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
