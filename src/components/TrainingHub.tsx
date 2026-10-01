import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, ChevronDown, Coins, Lock, Sparkles, TrendingUp, X } from 'lucide-react';
import { CoinsBadge } from './CoinsBadge';
import { ProgramDayCarousel } from './ProgramDayCarousel';
import { ProgramTrainingGuide } from './ProgramTrainingGuide';
import { useLanguage } from '../context/LanguageContext';
import { localizeVariant } from '../i18n/localize';
import { STORE_CATEGORIES, getVariantById, type Variant } from './moves';
import { TRAINING_DAY_OPTIONS, type TrainingDaysPerWeek } from '../hooks/useTrainingDaysPerWeek';
import type { DailySetGoal } from '../hooks/useDailySetGoal';
import {
  ROTATION_TEMPLATE_IDS,
  type RotatingProgramPhase,
  type RotatingProgramTemplateId
} from '../lib/rotatingProgram';
import { fx } from '../lib/feedback';

export type HubTab = 'plan' | 'shop';
type Slot = 'push' | 'pull' | 'legs' | 'core';
type Category = 'upper' | 'lower' | 'core';

const SLOT_CATEGORY: Record<Slot, Category> = { push: 'upper', pull: 'upper', legs: 'lower', core: 'core' };

/** The exercises that can fill a slot, easiest first (the progression ladder). */
function ladderFor(slot: Slot): Variant[] {
  if (slot === 'push' || slot === 'pull') return STORE_CATEGORIES[0].variants.filter((v) => v.pattern === slot);
  return (slot === 'legs' ? STORE_CATEGORIES[1] : STORE_CATEGORIES[2]).variants;
}

function slotOf(id: string): Slot | null {
  for (const slot of ['push', 'pull', 'legs', 'core'] as Slot[]) if (ladderFor(slot).some((v) => v.id === id)) return slot;
  return null;
}

const PRESETS: Array<{ id: 'starter' | 'balanced' | 'committed'; days: TrainingDaysPerWeek; sets: DailySetGoal }> = [
  { id: 'starter', days: 3, sets: 2 },
  { id: 'balanced', days: 4, sets: 3 },
  { id: 'committed', days: 5, sets: 3 }
];

type LineupEntry = { slot: Slot; category: Category; id: string | null };

interface TrainingHubProps {
  tab: HubTab;
  onTabChange: (tab: HubTab) => void;
  onBack: () => void;
  coins: number;
  owned: string[];
  equippedUpper: string[];
  equippedLower: string[];
  equippedCore: string[];
  /** Today's exercises when the program is on. */
  programLineup: { upper: string[]; lower: string[]; core: string[] };
  onBuy: (variant: Variant) => void;
  /** Put `toId` in the lineup in place of `fromId` (same category). */
  onSwap: (category: Category, fromId: string | null, toId: string) => void;
  rotatingProgramEnabled: boolean;
  onRotatingProgramEnabledChange: (enabled: boolean) => void;
  rotatingProgramTemplate: RotatingProgramTemplateId;
  onSelectProgramTemplate: (template: RotatingProgramTemplateId) => void;
  rotationCycle: readonly RotatingProgramPhase[];
  rotatingProgramCycleDay: number | null;
  rotatingProgramPhase: RotatingProgramPhase | null;
  onSelectProgramCycleDay: (cycleDay: number) => void;
  isRestDayToday: boolean;
  isDark: boolean;
  dailySetGoal: DailySetGoal;
  onDailySetGoalChange: (goal: DailySetGoal) => void;
  trainingDaysPerWeek: TrainingDaysPerWeek;
  onTrainingDaysChange: (days: TrainingDaysPerWeek) => void;
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useLanguage();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="base-sheet-root">
      <div className="base-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="base-sheet cyber-panel normal-case" role="dialog" aria-modal="true" aria-label={title}>
        <div className="base-sheet-head">
          <h2 className="base-sheet-title">{title}</h2>
          <button ref={closeRef} type="button" className="base-icon-btn" onClick={onClose} aria-label={t.game.close}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="base-sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function TrainingHub(props: TrainingHubProps) {
  const { t } = useLanguage();
  const h = t.hub;
  const { tab, onTabChange, onBack, coins } = props;

  return (
    <div className="hub-screen">
      <header className="hub-header">
        <button type="button" onClick={onBack} className="cyber-icon-btn cyber-icon-btn--back" aria-label={t.settings.back}>
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="hub-title">{h.title}</h1>
        <CoinsBadge coins={coins} />
      </header>

      <div className="hub-tabs" role="tablist">
        {(['plan', 'shop'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`hub-tab ${tab === id ? 'is-active' : ''}`}
            onClick={() => {
              fx.tick();
              onTabChange(id);
            }}>
            {h.tabs[id]}
          </button>
        ))}
      </div>

      {tab === 'plan' ? <PlanTab {...props} /> : <ShopTab {...props} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan tab
// ---------------------------------------------------------------------------

function useNames() {
  const { t } = useLanguage();
  return (id: string | null) => {
    const v = id ? getVariantById(id) : undefined;
    return v ? localizeVariant(v, t.moves).name : '—';
  };
}

function PlanTab(props: TrainingHubProps) {
  const { t } = useLanguage();
  const h = t.hub;
  const s = t.settings;
  const nameOf = useNames();
  const program = props.rotatingProgramEnabled;
  const [picking, setPicking] = useState<LineupEntry | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const upperPush = props.equippedUpper.find((id) => slotOf(id) === 'push') ?? null;
  const upperPull = props.equippedUpper.find((id) => slotOf(id) === 'pull') ?? null;
  const ownLineup: LineupEntry[] = [
    { slot: 'push', category: 'upper', id: upperPush },
    { slot: 'pull', category: 'upper', id: upperPull },
    { slot: 'legs', category: 'lower', id: props.equippedLower[0] ?? null },
    { slot: 'legs', category: 'lower', id: props.equippedLower[1] ?? null },
    { slot: 'core', category: 'core', id: props.equippedCore[0] ?? null },
    { slot: 'core', category: 'core', id: props.equippedCore[1] ?? null }
  ];
  const programIds = [...props.programLineup.upper, ...props.programLineup.lower, ...props.programLineup.core];
  const exercises = ownLineup.filter((e) => e.id).length;
  const minutes = Math.max(10, Math.round((exercises * props.dailySetGoal * 1.6) / 5) * 5);
  const activePreset = PRESETS.find((p) => p.days === props.trainingDaysPerWeek && p.sets === props.dailySetGoal)?.id;

  return (
    <div className="hub-body">
      <section aria-labelledby="hub-mode-title">
        <h2 id="hub-mode-title" className="hub-section-title">{h.mode.title}</h2>
        <div className="hub-mode-grid" role="radiogroup" aria-labelledby="hub-mode-title">
          {([false, true] as const).map((isProgram) => (
            <button
              key={String(isProgram)}
              type="button"
              role="radio"
              aria-checked={program === isProgram}
              className={`hub-mode-card ${program === isProgram ? 'is-active' : ''}`}
              onClick={() => {
                if (program !== isProgram) fx.confirm();
                props.onRotatingProgramEnabledChange(isProgram);
              }}>
              <span className="hub-mode-check" aria-hidden="true">
                {program === isProgram && <Check size={14} strokeWidth={3} />}
              </span>
              <span className="hub-mode-name">{isProgram ? h.mode.program : h.mode.own}</span>
              <span className="hub-mode-desc">{isProgram ? h.mode.programDesc : h.mode.ownDesc}</span>
            </button>
          ))}
        </div>
      </section>

      <p className="hub-summary" aria-live="polite">
        {program
          ? h.summary.program(props.rotationCycle.length)
          : h.summary.own(props.trainingDaysPerWeek, exercises, props.dailySetGoal, minutes)}
      </p>

      {program ? (
        <section className="hub-card">
          <h3 className="hub-card-title">{h.program.split}</h3>
          <div className="hub-segment" role="radiogroup" aria-label={h.program.split}>
            {ROTATION_TEMPLATE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={props.rotatingProgramTemplate === id}
                className={`hub-segment-btn ${props.rotatingProgramTemplate === id ? 'is-active' : ''}`}
                onClick={() => props.onSelectProgramTemplate(id)}>
                {s.rotatingProgram.template.options[id]}
              </button>
            ))}
          </div>
          <p className="hub-hint">{s.rotatingProgram.template.descriptions[props.rotatingProgramTemplate]}</p>
          {props.rotatingProgramPhase !== null && props.rotatingProgramCycleDay !== null && (
            <ProgramDayCarousel
              cycle={props.rotationCycle}
              cycleDay={props.rotatingProgramCycleDay}
              onSelectCycleDay={props.onSelectProgramCycleDay}
              getPhaseLabel={(phase) => s.rotatingProgram.phases[phase]}
              isDark={props.isDark}
              isRestDay={props.isRestDayToday}
              restTitle={s.rotatingProgram.restDay.carouselTitle}
              restKicker={s.rotatingProgram.restDay.carouselKicker}
            />
          )}
          <button type="button" className="hub-disclosure" aria-expanded={showGuide} onClick={() => setShowGuide((v) => !v)}>
            {showGuide ? h.program.hide : h.program.howItWorks}
            <ChevronDown size={16} strokeWidth={2.5} className={showGuide ? 'rotate-180' : ''} aria-hidden="true" />
          </button>
          {showGuide && <ProgramTrainingGuide />}
        </section>
      ) : (
        <>
          <section className="hub-card">
            <h3 className="hub-card-title">{h.presets.title}</h3>
            <div className="hub-preset-row">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={activePreset === p.id}
                  className={`hub-preset ${activePreset === p.id ? 'is-active' : ''}`}
                  onClick={() => {
                    fx.confirm();
                    props.onTrainingDaysChange(p.days);
                    props.onDailySetGoalChange(p.sets);
                  }}>
                  <span className="hub-preset-name">{h.presets[p.id]}</span>
                  <span className="hub-preset-detail">{h.presets.detail(p.days, p.sets)}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="hub-card">
            <h3 className="hub-card-title">{h.days.title}</h3>
            <div className="hub-segment" role="radiogroup" aria-label={h.days.title}>
              {TRAINING_DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={props.trainingDaysPerWeek === d}
                  className={`hub-segment-btn ${props.trainingDaysPerWeek === d ? 'is-active' : ''}`}
                  onClick={() => props.onTrainingDaysChange(d)}>
                  {d}
                </button>
              ))}
            </div>
            <p className="hub-hint">{h.days.hint(7 - props.trainingDaysPerWeek)}</p>

            <h3 className="hub-card-title hub-card-title--spaced">{h.sets.title}</h3>
            <div className="hub-segment" role="radiogroup" aria-label={h.sets.title}>
              {([2, 3] as const).map((goal) => (
                <button
                  key={goal}
                  type="button"
                  role="radio"
                  aria-checked={props.dailySetGoal === goal}
                  className={`hub-segment-btn ${props.dailySetGoal === goal ? 'is-active' : ''}`}
                  onClick={() => props.onDailySetGoalChange(goal)}>
                  {s.dailySetTarget.sets(goal)}
                </button>
              ))}
            </div>
            <p className="hub-hint">{h.sets.hint}</p>
          </section>
        </>
      )}

      <section className="hub-card">
        <h3 className="hub-card-title">{h.lineup.title}</h3>
        <p className="hub-hint">{program ? h.lineup.programNote : h.lineup.hint}</p>
        <ul className="hub-lineup">
          {program
            ? programIds.length
              ? programIds.map((id) => (
                  <li key={id} className="hub-slot is-locked">
                    <span className="hub-slot-label">{h.lineup.slots[slotOf(id) ?? 'core']}</span>
                    <span className="hub-slot-name">{nameOf(id)}</span>
                    <Lock size={14} strokeWidth={2.5} aria-hidden="true" />
                  </li>
                ))
              : <li className="hub-slot is-locked"><span className="hub-slot-name">{h.lineup.empty}</span></li>
            : ownLineup.map((entry, i) => (
                <li key={`${entry.slot}-${i}`}>
                  <button type="button" className="hub-slot" onClick={() => setPicking(entry)}>
                    <span className="hub-slot-label">{h.lineup.slots[entry.slot]}</span>
                    <span className="hub-slot-name">{nameOf(entry.id)}</span>
                    <ChevronDown size={16} strokeWidth={2.5} className="hub-slot-chevron" aria-hidden="true" />
                  </button>
                </li>
              ))}
        </ul>
      </section>

      {picking && (
        <SlotPicker
          entry={picking}
          props={props}
          onClose={() => setPicking(null)}
          onPick={(id) => {
            fx.confirm();
            props.onSwap(picking.category, picking.id, id);
            setPicking(null);
          }}
        />
      )}
    </div>
  );
}

function SlotPicker({
  entry,
  props,
  onClose,
  onPick
}: {
  entry: LineupEntry;
  props: TrainingHubProps;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const { t } = useLanguage();
  const h = t.hub;
  const equipped = new Set([...props.equippedUpper, ...props.equippedLower, ...props.equippedCore]);
  return (
    <Sheet title={h.picker.title(h.lineup.slots[entry.slot])} onClose={onClose}>
      <ul className="hub-list">
        {ladderFor(entry.slot).map((v, i, all) => (
          <ExerciseRow
            key={v.id}
            variant={v}
            step={i + 1}
            total={all.length}
            coins={props.coins}
            owned={props.owned.includes(v.id)}
            inLineup={v.id === entry.id}
            alsoEquipped={v.id !== entry.id && equipped.has(v.id)}
            onBuy={() => props.onBuy(v)}
            onUse={() => onPick(v.id)}
          />
        ))}
      </ul>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Shop tab
// ---------------------------------------------------------------------------

function ExerciseRow({
  variant,
  step,
  total,
  coins,
  owned,
  inLineup,
  alsoEquipped = false,
  useLocked = false,
  onBuy,
  onUse,
  onDetails
}: {
  variant: Variant;
  step: number;
  total: number;
  coins: number;
  owned: boolean;
  inLineup: boolean;
  alsoEquipped?: boolean;
  useLocked?: boolean;
  onBuy: () => void;
  onUse: () => void;
  onDetails?: () => void;
}) {
  const { t } = useLanguage();
  const h = t.hub;
  const v = localizeVariant(variant, t.moves);
  const gear = variant.equipment?.length
    ? variant.equipment.map((item) => t.dashboard.equipment[item]).join(' + ')
    : t.store.noGear;
  const affordable = coins >= variant.price;
  const levelUp = variant.repCeiling
    ? h.shop.levelUpAfter(variant.repCeiling)
    : variant.holdCeilingSeconds
      ? h.shop.holdLevelUp(variant.holdCeilingSeconds)
      : null;
  return (
    <li className={`hub-row ${inLineup || alsoEquipped ? 'is-equipped' : ''} ${!owned ? 'is-unowned' : ''}`}>
      <button type="button" className="hub-row-main" onClick={onDetails} disabled={!onDetails}>
        <span className="hub-row-top">
          <span className="hub-row-name">{v.name}</span>
          <span className={`hub-tier hub-tier--${variant.tier.toLowerCase()}`}>{variant.tier.toLowerCase()}</span>
        </span>
        <span className="hub-row-desc">{v.description}</span>
        <span className="hub-row-meta">
          <span>{h.shop.step(step, total)}</span>
          <span>{gear}</span>
          {levelUp && <span>{levelUp}</span>}
        </span>
      </button>
      <span className="hub-row-action">
        {inLineup || alsoEquipped ? (
          <span className="hub-status hub-status--equipped">
            <Check size={14} strokeWidth={3} aria-hidden="true" />
            {h.shop.inLineup}
          </span>
        ) : owned ? (
          useLocked ? (
            <span className="hub-status">{h.shop.owned}</span>
          ) : (
            <button type="button" className="hub-action-btn" onClick={onUse}>
              {h.shop.use}
            </button>
          )
        ) : (
          <button
            type="button"
            className="hub-action-btn hub-action-btn--buy"
            disabled={!affordable}
            title={!affordable ? h.picker.needCoins : undefined}
            onClick={onBuy}>
            <Coins size={14} strokeWidth={2.5} aria-hidden="true" />
            {variant.price === 0 ? h.shop.free : variant.price}
          </button>
        )}
      </span>
    </li>
  );
}

function ShopTab(props: TrainingHubProps) {
  const { t } = useLanguage();
  const h = t.hub;
  const nameOf = useNames();
  const [filter, setFilter] = useState<'all' | Slot>('all');
  const [noGear, setNoGear] = useState(false);
  const [replacing, setReplacing] = useState<Variant | null>(null);
  const [details, setDetails] = useState<Variant | null>(null);
  const program = props.rotatingProgramEnabled;
  const lineup = useMemo(
    () => new Set([...props.equippedUpper, ...props.equippedLower, ...props.equippedCore]),
    [props.equippedUpper, props.equippedLower, props.equippedCore]
  );

  // Suggest the cheapest next step from what's in the lineup now.
  const suggestion = useMemo(() => {
    let best: { from: Variant; to: Variant } | null = null;
    for (const id of lineup) {
      const from = getVariantById(id);
      for (const nextId of from?.levelUp ?? []) {
        const to = getVariantById(nextId);
        if (!from || !to || props.owned.includes(to.id)) continue;
        if (!best || to.price < best.to.price) best = { from, to };
        break;
      }
    }
    return best;
  }, [lineup, props.owned]);

  const use = (variant: Variant) => {
    const slot = slotOf(variant.id);
    if (!slot) return;
    const category = SLOT_CATEGORY[slot];
    if (slot === 'push' || slot === 'pull') {
      const current = props.equippedUpper.find((id) => slotOf(id) === slot) ?? null;
      fx.confirm();
      props.onSwap('upper', current, variant.id);
      return;
    }
    // Two slots of the same kind: ask which one to replace.
    const list = category === 'lower' ? props.equippedLower : props.equippedCore;
    if (list.length < 2) {
      fx.confirm();
      props.onSwap(category, null, variant.id);
      return;
    }
    setReplacing(variant);
  };

  const slots: Slot[] = filter === 'all' ? ['push', 'pull', 'legs', 'core'] : [filter];
  const shown = slots.map((slot) => ({
    slot,
    items: ladderFor(slot)
      .map((v, i, all) => ({ v, step: i + 1, total: all.length }))
      .filter(({ v }) => !noGear || !v.equipment?.length)
  }));
  const anything = shown.some((group) => group.items.length);

  return (
    <div className="hub-body">
      {suggestion && (
        <section className="hub-next">
          <span className="hub-next-icon" aria-hidden="true">
            <TrendingUp size={18} strokeWidth={2.75} />
          </span>
          <div className="hub-next-text">
            <span className="hub-next-title">{h.shop.nextStep}</span>
            <span className="hub-next-line">
              {h.shop.nextLine(localizeVariant(suggestion.from, t.moves).name, localizeVariant(suggestion.to, t.moves).name)}
            </span>
          </div>
          <button
            type="button"
            className="hub-action-btn hub-action-btn--buy"
            disabled={props.coins < suggestion.to.price}
            onClick={() => props.onBuy(suggestion.to)}>
            <Coins size={14} strokeWidth={2.5} aria-hidden="true" />
            {suggestion.to.price}
          </button>
        </section>
      )}

      <div className="hub-filters">
        <div className="base-chip-row" role="radiogroup" aria-label={h.tabs.shop}>
          {(['all', 'push', 'pull', 'legs', 'core'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={filter === id}
              className={`base-chip ${filter === id ? 'is-active' : ''}`}
              onClick={() => setFilter(id)}>
              {h.shop.filters[id]}
            </button>
          ))}
        </div>
        <label className="hub-switch">
          <input type="checkbox" checked={noGear} onChange={(e) => setNoGear(e.target.checked)} />
          <span className="hub-switch-track" aria-hidden="true" />
          {h.shop.noGear}
        </label>
      </div>

      {program && <p className="hub-hint hub-hint--note">{h.shop.programLocked}</p>}

      {anything ? (
        shown.map(
          (group) =>
            group.items.length > 0 && (
              <section key={group.slot} aria-label={h.lineup.slots[group.slot]}>
                {filter === 'all' && <h3 className="hub-group-title">{h.lineup.slots[group.slot]}</h3>}
                <ul className="hub-list">
                  {group.items.map(({ v, step, total }) => (
                    <ExerciseRow
                      key={v.id}
                      variant={v}
                      step={step}
                      total={total}
                      coins={props.coins}
                      owned={props.owned.includes(v.id)}
                      inLineup={!program && lineup.has(v.id)}
                      useLocked={program}
                      onBuy={() => props.onBuy(v)}
                      onUse={() => use(v)}
                      onDetails={() => setDetails(v)}
                    />
                  ))}
                </ul>
              </section>
            )
        )
      ) : (
        <p className="hub-hint">{h.shop.empty}</p>
      )}

      {replacing && (
        <Sheet title={h.picker.replace} onClose={() => setReplacing(null)}>
          <ul className="hub-lineup">
            {(SLOT_CATEGORY[slotOf(replacing.id) ?? 'legs'] === 'lower' ? props.equippedLower : props.equippedCore).map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className="hub-slot"
                  onClick={() => {
                    fx.confirm();
                    props.onSwap(SLOT_CATEGORY[slotOf(replacing.id) ?? 'legs'], id, replacing.id);
                    setReplacing(null);
                  }}>
                  <span className="hub-slot-name">{nameOf(id)}</span>
                  <span className="hub-slot-label">→ {localizeVariant(replacing, t.moves).name}</span>
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}

      {details && (
        <Sheet title={localizeVariant(details, t.moves).name} onClose={() => setDetails(null)}>
          <p className="hub-detail-desc">{localizeVariant(details, t.moves).description}</p>
          <h3 className="hub-card-title">
            <Sparkles size={14} strokeWidth={2.5} aria-hidden="true" /> {h.shop.ladder}
          </h3>
          <ol className="hub-ladder">
            {ladderFor(slotOf(details.id) ?? 'push').map((step) => (
              <li
                key={step.id}
                className={`${step.id === details.id ? 'is-current' : ''} ${props.owned.includes(step.id) ? 'is-owned' : ''}`}>
                {props.owned.includes(step.id) ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : <Lock size={12} strokeWidth={2.5} aria-hidden="true" />}
                {localizeVariant(step, t.moves).name}
              </li>
            ))}
          </ol>
          <ul className="hub-list">
            <ExerciseRow
              variant={details}
              step={ladderFor(slotOf(details.id) ?? 'push').findIndex((v) => v.id === details.id) + 1}
              total={ladderFor(slotOf(details.id) ?? 'push').length}
              coins={props.coins}
              owned={props.owned.includes(details.id)}
              inLineup={!program && lineup.has(details.id)}
              useLocked={program}
              onBuy={() => props.onBuy(details)}
              onUse={() => {
                use(details);
                setDetails(null);
              }}
            />
          </ul>
        </Sheet>
      )}
    </div>
  );
}
