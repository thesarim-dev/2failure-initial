import { ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getVariantById } from './moves';
import { localizeVariant } from '../i18n/localize';
import { ALL_GEAR, planForPhase, unlocksFor, type Gear, type TrainingPhase } from '../lib/plan';
import type { RotatingProgramPhase } from '../lib/rotatingProgram';
import { fx } from '../lib/feedback';

/** Simple line drawings of each piece of gear. */
function GearIcon({ item }: { item: Gear }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 48 32" width={48} height={32} className="plan-gear-icon" aria-hidden="true">
      {item === 'bar' && (
        <g {...common}>
          <path d="M8 30 V6 M40 30 V6" />
          <path d="M4 6 H44" strokeWidth={3.2} />
        </g>
      )}
      {item === 'dipBars' && (
        <g {...common}>
          <path d="M10 30 V12 M38 30 V12 M16 30 V18 M32 30 V18" />
          <path d="M6 12 H20 M28 12 H42" strokeWidth={3.2} />
        </g>
      )}
      {item === 'dumbbell' && (
        <g {...common}>
          <path d="M14 16 H34" strokeWidth={3.2} />
          <rect x={6} y={8} width={8} height={16} rx={2} />
          <rect x={34} y={8} width={8} height={16} rx={2} />
        </g>
      )}
      {item === 'barbell' && (
        <g {...common}>
          <path d="M2 16 H46" strokeWidth={2.6} />
          <rect x={8} y={5} width={5} height={22} rx={1.5} />
          <rect x={14} y={8} width={4} height={16} rx={1.5} />
          <rect x={35} y={5} width={5} height={22} rx={1.5} />
          <rect x={30} y={8} width={4} height={16} rx={1.5} />
        </g>
      )}
    </svg>
  );
}

/**
 * "Your plan": the one place to set up training. Days per week, equipment,
 * the week's rotation, and each day's exercises with Easier / Harder.
 */
export function PlanScreen({
  onBack,
  days,
  onDays,
  rotation,
  cycleDay,
  isRestDayToday,
  gear,
  onToggleGear,
  levels,
  onSetLevel,
  onSelectDay
}: {
  onBack: () => void;
  days: 3 | 4 | 5;
  onDays: (days: 3 | 4 | 5) => void;
  rotation: readonly RotatingProgramPhase[];
  cycleDay: number | null;
  isRestDayToday: boolean;
  gear: Gear[];
  onToggleGear: (item: Gear) => void;
  levels: Record<string, string>;
  onSetLevel: (slotKey: string, exerciseId: string) => void;
  /** Make a day of the week (1-based) today's workout. */
  onSelectDay: (cycleDay: number) => void;
}) {
  const { t } = useLanguage();
  const p = t.hub.plan;
  const todayIndex = cycleDay !== null && rotation.length ? (cycleDay - 1) % rotation.length : 0;
  const todayPhase = rotation[todayIndex];
  const trainingToday = !isRestDayToday && !!todayPhase && todayPhase !== 'recovery';
  const planned = trainingToday ? planForPhase(todayPhase as TrainingPhase, gear, levels) : [];
  const name = (id: string) => {
    const variant = getVariantById(id);
    return variant ? localizeVariant(variant, t.moves).name : id;
  };

  return (
    <div className="plan-screen flex flex-col w-full min-h-full p-4 md:p-8 max-w-2xl mx-auto pb-28 gap-4 normal-case">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="cyber-icon-btn cyber-icon-btn--back" aria-label={t.settings.back}>
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="text-2xl">{p.title}</h1>
      </header>

      <section className="plan-card-block">
        <h2 className="plan-block-title">{p.days}</h2>
        <p className="plan-block-sub">{p.daysSub}</p>
        <div className="plan-days" role="radiogroup" aria-label={p.days}>
          {([3, 4, 5] as const).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={days === n}
              className={`plan-day-btn ${days === n ? 'is-on' : ''}`}
              onClick={() => {
                if (days !== n) fx.tap();
                onDays(n);
              }}>
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="plan-card-block">
        <h2 className="plan-block-title">{p.gear}</h2>
        <p className="plan-block-sub">{p.gearSub}</p>
        <div className="plan-gear">
          {ALL_GEAR.map((item) => {
            const on = gear.includes(item);
            const unlocked = unlocksFor(item).map(name);
            const shown = unlocked.slice(0, 2).join(', ');
            return (
              <button
                key={item}
                type="button"
                aria-pressed={on}
                className={`plan-gear-card ${on ? 'is-on' : ''}`}
                onClick={() => {
                  fx.tap();
                  onToggleGear(item);
                }}>
                <span className="plan-gear-check" aria-hidden="true">
                  {on && <Check size={14} strokeWidth={3.5} />}
                </span>
                <GearIcon item={item} />
                <span className="plan-gear-name">{p.gearNames[item as keyof typeof p.gearNames]}</span>
                <span className="plan-gear-unlocks">{p.unlocks(shown, unlocked.length - 2)}</span>
              </button>
            );
          })}
        </div>
        <p className="plan-gear-note">{p.gearNote}</p>
      </section>

      <section className="plan-card-block">
        <h2 className="plan-block-title">{p.week}</h2>
        <p className="plan-block-sub">{p.weekSub}</p>
        <ol className="plan-week">
          {rotation.map((phase, i) => {
            const isToday = i === todayIndex;
            return (
              <li key={`${phase}-${i}`}>
                <button
                  type="button"
                  className={`plan-week-day ${isToday ? 'is-today' : ''}`}
                  aria-current={isToday ? 'true' : undefined}
                  disabled={isRestDayToday && !isToday}
                  onClick={() => {
                    if (isToday) return;
                    fx.tap();
                    onSelectDay(i + 1);
                  }}>
                  <span className="plan-week-num">{p.dayLabel(i + 1)}</span>
                  <span className="plan-week-name">{phase === 'recovery' ? p.rest : p.dayNames[phase as TrainingPhase]}</span>
                  {isToday ? (
                    <span className="plan-week-today">{isRestDayToday ? p.rest : p.today}</span>
                  ) : (
                    <ChevronRight size={16} strokeWidth={2.75} className="plan-week-go tour-icon-flip" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="plan-card-block">
        <h2 className="plan-block-title">
          {trainingToday ? p.todayTitle(p.dayNames[todayPhase as TrainingPhase]) : p.rest}
        </h2>
        {trainingToday && <p className="plan-block-sub">{p.focus[todayPhase as TrainingPhase]}</p>}
        <ul className="plan-exercises">
          {planned.map(({ slot, exerciseId, easier, harder }) => (
            <li key={slot.key} className="plan-exercise">
              <div className="plan-exercise-text">
                <span className="plan-exercise-muscle">
                  {p.muscles[slot.muscle] ?? slot.muscle} · {p.sets(slot.sets)}
                </span>
                <span className="plan-exercise-name">{name(exerciseId)}</span>
              </div>
              <div className="plan-exercise-actions">
                <button
                  type="button"
                  className="plan-step-btn"
                  disabled={!easier}
                  aria-label={easier ? `${p.easier}: ${name(easier)}` : p.easier}
                  onClick={() => easier && (fx.tap(), onSetLevel(slot.key, easier))}>
                  <ChevronLeft size={16} strokeWidth={3} className="tour-icon-flip" aria-hidden="true" />
                  {p.easier}
                </button>
                <button
                  type="button"
                  className="plan-step-btn is-harder"
                  disabled={!harder}
                  aria-label={harder ? `${p.harder}: ${name(harder)}` : p.harder}
                  onClick={() => harder && (fx.tap(), onSetLevel(slot.key, harder))}>
                  {p.harder}
                  <ChevronRight size={16} strokeWidth={3} className="tour-icon-flip" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
