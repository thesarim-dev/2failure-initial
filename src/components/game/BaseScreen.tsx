import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, Hammer, Move as MoveIcon, ShieldCheck, Trophy, X } from 'lucide-react';
import { getVariantById } from '../moves';
import { localizeVariant } from '../../i18n/localize';
import { useLanguage } from '../../context/LanguageContext';
import {
  DECOR,
  GRID_SIZE,
  HQ_WEEKS_REQUIRED,
  MAX_HQ_LEVEL,
  RESOURCE_IDS,
  STRUCTURES,
  TROPHIES,
  TROPHY_ITEM_PREFIX,
  getItemDef,
  type Cost,
  type ResourceId,
  type Resources
} from '../../game/catalog';
import {
  WEEKLY_BONUS_AMOUNT,
  canPlaceAt,
  currentWeeklyStreak,
  forgeRate,
  hqLevel,
  isQuietToday,
  placeBlocker,
  questSlots,
  sessionBonusAmount,
  shieldCapacity,
  structureLevel,
  trainingDaysThisWeek,
  upgradeBlocker,
  type ActionError,
  type PlacedItem,
  type Quest,
  type TodayPlan
} from '../../game/engine';
import type { BaseGame } from '../../game/useBaseGame';
import { BaseBoard, ItemPreview, RESOURCE_COLOR } from './BaseBoard';

type Mode =
  | { kind: 'idle' }
  | { kind: 'place'; itemId: string }
  | { kind: 'placeTrophy'; trophyId: string }
  | { kind: 'move'; uid: string };

type SheetState = null | 'build' | 'trophies' | { uid: string };

export function ResourceIcon({ id, size = 18 }: { id: ResourceId; size?: number }) {
  const c = RESOURCE_COLOR[id];
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="base-resource-icon">
      {id === 'stone' && <path d="M5 15 L8 7 L15 5 L20 11 L18 18 L9 19 Z" fill={c} />}
      {id === 'timber' && (
        <g>
          <rect x={3} y={8} width={16} height={9} rx={4.5} fill={c} />
          <circle cx={18} cy={12.5} r={4.5} fill="#7a4b12" stroke={c} strokeWidth={1.5} />
        </g>
      )}
      {id === 'iron' && <path d="M4 17 L7 8 H17 L20 17 Z" fill={c} />}
      {id === 'crystal' && <path d="M12 3 L18 10 L12 21 L6 10 Z" fill={c} />}
    </svg>
  );
}

function CostList({ cost, resources }: { cost: Cost; resources: Resources }) {
  const { t } = useLanguage();
  const parts = RESOURCE_IDS.filter((id) => (cost[id] ?? 0) > 0);
  return (
    <span className="base-cost">
      {parts.map((id) => {
        const short = resources[id] < (cost[id] ?? 0);
        return (
          <span key={id} className={`base-cost-chip ${short ? 'is-short' : ''}`}>
            <ResourceIcon id={id} size={14} />
            <span className="tabular-nums">{cost[id]}</span>
            <span className="sr-only">{t.game.resources[id]}</span>
          </span>
        );
      })}
    </span>
  );
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

function useExerciseName() {
  const { t } = useLanguage();
  return (id?: string) => {
    const variant = id ? getVariantById(id) : undefined;
    return variant ? localizeVariant(variant, t.moves).name : id ?? '';
  };
}

export function useQuestText() {
  const { t } = useLanguage();
  const nameOf = useExerciseName();
  return (quest: Quest) => {
    const q = t.game.quests;
    switch (quest.kind) {
      case 'finishExercise':
        return q.finishExercise(nameOf(quest.exerciseId), quest.target);
      case 'inRange':
        return q.inRange(nameOf(quest.exerciseId), quest.min ?? 0, quest.max ?? 0);
      case 'patternSets':
        return q.patternSets(quest.target, t.game.patterns[quest.pattern ?? 'push']);
      case 'stretch':
        return q.stretch(quest.target);
    }
  };
}

function TodayPanel({ game, plan, onGoTrain }: { game: BaseGame; plan: TodayPlan | null; onGoTrain: () => void }) {
  const { t } = useLanguage();
  const g = t.game;
  const { state } = game;
  const questText = useQuestText();
  const planned = plan?.exercises.reduce((n, e) => n + e.target, 0) ?? 0;
  const done = plan?.exercises.reduce((n, e) => n + Math.min(e.done, e.target), 0) ?? 0;
  const sessionDone = !!plan && state.stats.sessionDay === plan.day;
  const weekDone = trainingDaysThisWeek(state);
  const weekTarget = plan?.weeklyTarget ?? 0;
  const weekHit = weekTarget > 0 && weekDone >= weekTarget;
  const weeklyStreak = currentWeeklyStreak(state);
  const quests = plan && state.quests?.day === plan.day ? state.quests.list : [];

  return (
    <section className="base-today cyber-panel normal-case" aria-label={g.today.title}>
      <div className="base-today-head">
        <h2 className="base-today-title">{g.today.title}</h2>
        {!plan?.isRestDay && !sessionDone && (
          <button type="button" className="base-status-btn" onClick={onGoTrain}>
            {g.goTrain}
          </button>
        )}
      </div>

      {plan?.isRestDay ? (
        <p className="base-today-line">{g.today.rest}</p>
      ) : (
        planned > 0 && (
          <>
            <p className="base-today-line">{g.today.training(done, planned)}</p>
            <div className="base-progress" role="progressbar" aria-valuemin={0} aria-valuemax={planned} aria-valuenow={done}>
              <span style={{ width: `${Math.round((done / planned) * 100)}%` }} />
            </div>
            <p className="base-today-sub">
              {sessionDone ? g.today.sessionDone : g.today.sessionBonus(sessionBonusAmount(state, false))}
            </p>
          </>
        )
      )}

      {weekTarget > 0 && (
        <p className="base-today-line">
          {g.today.week(Math.min(weekDone, weekTarget), weekTarget)}
          <span className="base-today-sub">
            {' · '}
            {weekHit ? g.today.weeklyDone : g.today.weeklyBonus(WEEKLY_BONUS_AMOUNT)}
          </span>
          {weeklyStreak > 0 && <span className="base-today-streak">{g.today.weeklyStreak(weeklyStreak)}</span>}
        </p>
      )}

      <div className="base-quests">
        <h3 className="base-quests-title">{g.quests.title}</h3>
        {quests.length ? (
          <ul className="base-quest-list">
            {quests.map((quest) => (
              <li key={quest.id} className={`base-quest ${quest.done ? 'is-done' : ''}`}>
                <span className="base-quest-check" aria-hidden="true">
                  {quest.done && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="base-quest-text">
                  {questText(quest)}
                  {quest.done ? (
                    <span className="sr-only"> · {g.quests.done}</span>
                  ) : (
                    quest.target > 1 && (
                      <span className="base-quest-progress tabular-nums">
                        {' '}
                        {Math.min(quest.progress, quest.target)}/{quest.target}
                      </span>
                    )
                  )}
                </span>
                <CostList cost={quest.reward} resources={{ stone: 1e9, timber: 1e9, iron: 1e9, crystal: 1e9 }} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="base-today-sub">{g.quests.none}</p>
        )}
        {questSlots(state) < 4 && !plan?.isRestDay && <p className="base-today-sub">{g.quests.moreSlots}</p>}
      </div>
    </section>
  );
}

export function BaseScreen({ game, onGoTrain }: { game: BaseGame; onGoTrain: () => void }) {
  const { t, language } = useLanguage();
  const g = t.game;
  const { state } = game;
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [sheet, setSheet] = useState<SheetState>(null);
  const [buildTab, setBuildTab] = useState<'structures' | 'decor'>('structures');
  const [notice, setNotice] = useState<string | null>(null);
  const level = hqLevel(state);
  const lit = !isQuietToday(state);
  const earnedCount = Object.keys(state.trophies).length;

  useEffect(() => {
    game.markSeen();
    // Only on open: anything new is now on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(id);
  }, [notice]);

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(language, { dateStyle: 'medium' }),
    [language]
  );

  const nameOf = (itemId: string) => {
    if (itemId.startsWith(TROPHY_ITEM_PREFIX)) {
      return g.trophyNames[itemId.slice(TROPHY_ITEM_PREFIX.length)]?.name ?? '';
    }
    return g.items[itemId]?.name ?? itemId;
  };

  const errorText = (error: ActionError, itemId?: string) => {
    if (error === 'locked' && itemId) {
      const def = getItemDef(itemId);
      if (def) return g.errors.unlockAt(def.unlockHq);
    }
    return g.errors[error];
  };

  const modeItemId =
    mode.kind === 'place'
      ? mode.itemId
      : mode.kind === 'placeTrophy'
        ? `${TROPHY_ITEM_PREFIX}${mode.trophyId}`
        : mode.kind === 'move'
          ? state.placed.find((p) => p.uid === mode.uid)?.itemId ?? null
          : null;

  const validTiles = useMemo(() => {
    if (!modeItemId) return null;
    const ignore = mode.kind === 'move' ? mode.uid : undefined;
    const set = new Set<string>();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (canPlaceAt(state, modeItemId, x, y, ignore)) set.add(`${x},${y}`);
      }
    }
    return set;
  }, [mode, modeItemId, state]);

  const handleTile = (x: number, y: number) => {
    if (mode.kind === 'idle') {
      setSheet(null);
      return;
    }
    const result =
      mode.kind === 'place'
        ? game.place(mode.itemId, x, y)
        : mode.kind === 'placeTrophy'
          ? game.placeTrophy(mode.trophyId, x, y)
          : game.move(mode.uid, x, y);
    if (!result.ok) {
      setNotice(errorText(result.error, modeItemId ?? undefined));
      return;
    }
    setMode({ kind: 'idle' });
  };

  const selected = sheet && typeof sheet === 'object' ? state.placed.find((p) => p.uid === sheet.uid) : undefined;
  const construction = state.construction;
  const constructionItem = construction && state.placed.find((p) => p.uid === construction.uid);

  const statusLine = (() => {
    if (constructionItem && construction) {
      return (
        <div className="base-status base-status--building">
          <Hammer size={16} strokeWidth={2.5} aria-hidden="true" />
          <span>{g.status.building(nameOf(constructionItem.itemId), construction.setsRemaining)}</span>
          <button type="button" className="base-status-btn" onClick={onGoTrain}>
            {g.goTrain}
          </button>
        </div>
      );
    }
    if (!lit) return <p className="base-status">{g.status.quiet}</p>;
    return null;
  })();

  const labelForItem = (item: PlacedItem) => {
    const def = getItemDef(item.itemId);
    const name = nameOf(item.itemId);
    return def?.kind === 'structure' ? `${name}, ${g.level(Math.max(item.level, 1))}` : name;
  };

  return (
    <div className="base-screen">
      <header className="base-header">
        <h1 className="base-title">{g.title}</h1>
        <span className="base-hq-chip">{g.hqLevel(level)}</span>
      </header>

      <div className="base-resources" role="list">
        {RESOURCE_IDS.map((id) => (
          <div key={id} role="listitem" className="base-resource" title={g.resourceSource[id]}>
            <ResourceIcon id={id} />
            <span className="base-resource-count tabular-nums">{state.resources[id]}</span>
            <span className="base-resource-label">{g.resources[id]}</span>
          </div>
        ))}
      </div>

      {!state.introSeen && (
        <section className="base-intro cyber-panel normal-case">
          <h2 className="base-intro-title">{g.intro.title}</h2>
          <p>{g.intro.body}</p>
          <p className="base-intro-rule">{g.intro.rule}</p>
          <button type="button" className="base-primary-btn" onClick={game.dismissIntro}>
            {g.intro.ok}
          </button>
        </section>
      )}

      {statusLine}

      <TodayPanel game={game} plan={game.plan} onGoTrain={onGoTrain} />

      {mode.kind !== 'idle' && modeItemId && (
        <div className="base-mode-bar" role="status">
          <span>
            {mode.kind === 'move' ? g.moveHint(nameOf(modeItemId)) : g.placeHint(nameOf(modeItemId))}
          </span>
          <button type="button" className="base-ghost-btn" onClick={() => setMode({ kind: 'idle' })}>
            {g.cancel}
          </button>
        </div>
      )}

      <div className="base-board-wrap" dir="ltr">
        <BaseBoard
          state={state}
          plan={game.plan}
          lit={lit}
          selectedUid={selected?.uid ?? null}
          validTiles={validTiles}
          labelForItem={labelForItem}
          tileLabel={(x, y) => `${modeItemId ? nameOf(modeItemId) : ''} ${x + 1},${y + 1}`}
          onTile={handleTile}
          onItem={(uid) => setSheet({ uid })}
        />
        {notice && (
          <p className="base-notice" role="status">
            {notice}
          </p>
        )}
      </div>

      {mode.kind === 'idle' && (
        <div className="base-actions">
          <button type="button" className="base-primary-btn" onClick={() => setSheet('build')}>
            <Hammer size={18} strokeWidth={2.5} aria-hidden="true" />
            {g.build}
          </button>
          <button type="button" className="base-secondary-btn" onClick={() => setSheet('trophies')}>
            <Trophy size={18} strokeWidth={2.5} aria-hidden="true" />
            {g.trophies(earnedCount, TROPHIES.length)}
          </button>
        </div>
      )}

      {sheet === 'build' && (
        <Sheet title={g.build} onClose={() => setSheet(null)}>
          <div className="base-tabs" role="tablist">
            {(['structures', 'decor'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={buildTab === tab}
                className={`base-tab ${buildTab === tab ? 'is-active' : ''}`}
                onClick={() => setBuildTab(tab)}>
                {g.buildTabs[tab]}
              </button>
            ))}
          </div>
          <ul className="base-catalog">
            {(buildTab === 'structures' ? STRUCTURES.filter((s) => s.id !== 'hq') : DECOR).map((def) => {
              const blocker = placeBlocker(state, def.id);
              const cost = def.kind === 'structure' ? def.levels[0].cost : def.cost;
              return (
                <li key={def.id}>
                  <button
                    type="button"
                    className="base-catalog-item"
                    disabled={blocker !== null}
                    onClick={() => {
                      setSheet(null);
                      setMode({ kind: 'place', itemId: def.id });
                    }}>
                    <ItemPreview itemId={def.id} />
                    <span className="base-catalog-text">
                      <span className="base-catalog-name">{g.items[def.id]?.name}</span>
                      <span className="base-catalog-desc">{g.items[def.id]?.description}</span>
                      <span className="base-catalog-meta">
                        <CostList cost={cost} resources={state.resources} />
                        {def.kind === 'structure' && (
                          <span className="base-catalog-sets">{g.setsToBuild(def.levels[0].sets)}</span>
                        )}
                      </span>
                      {blocker && <span className="base-catalog-blocker">{errorText(blocker, def.id)}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}

      {sheet === 'trophies' && (
        <Sheet title={g.trophyShelf.title} onClose={() => setSheet(null)}>
          <p className="base-sheet-intro">{g.trophyShelf.intro}</p>
          <ul className="base-trophy-grid">
            {TROPHIES.map((def) => {
              const earned = state.trophies[def.id];
              const copy = g.trophyNames[def.id];
              const placed = state.placed.some((p) => p.itemId === `${TROPHY_ITEM_PREFIX}${def.id}`);
              return (
                <li key={def.id} className={`base-trophy ${earned ? 'is-earned' : 'is-locked'}`}>
                  <ItemPreview trophyId={def.id} verified={earned?.verified} size={64} />
                  <span className="base-trophy-name">{copy?.name}</span>
                  {earned ? (
                    <>
                      <span className="base-trophy-proof">{copy?.proof(earned.value ?? 0)}</span>
                      <span className="base-trophy-date">
                        {g.trophyShelf.earnedOn(dateFormat.format(new Date(earned.earnedAt)))}
                      </span>
                      {earned.verified && (
                        <span className="base-trophy-verified">
                          <ShieldCheck size={13} strokeWidth={2.5} aria-hidden="true" />
                          {g.trophyShelf.verified}
                        </span>
                      )}
                      {placed ? (
                        <span className="base-trophy-placed">{g.trophyShelf.onBase}</span>
                      ) : (
                        <button
                          type="button"
                          className="base-small-btn"
                          onClick={() => {
                            setSheet(null);
                            setMode({ kind: 'placeTrophy', trophyId: def.id });
                          }}>
                          {g.trophyShelf.place}
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="base-trophy-how">{copy?.how}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}

      {selected && (
        <ItemSheet
          item={selected}
          game={game}
          nameOf={nameOf}
          errorText={errorText}
          dateFormat={dateFormat}
          onClose={() => setSheet(null)}
          onMove={() => {
            setSheet(null);
            setMode({ kind: 'move', uid: selected.uid });
          }}
          onNotice={setNotice}
        />
      )}
    </div>
  );
}

function ItemSheet({
  item,
  game,
  nameOf,
  errorText,
  dateFormat,
  onClose,
  onMove,
  onNotice
}: {
  item: PlacedItem;
  game: BaseGame;
  nameOf: (itemId: string) => string;
  errorText: (error: ActionError, itemId?: string) => string;
  dateFormat: Intl.DateTimeFormat;
  onClose: () => void;
  onMove: () => void;
  onNotice: (text: string) => void;
}) {
  const { t } = useLanguage();
  const g = t.game;
  const { state } = game;
  const def = getItemDef(item.itemId);
  const isTrophy = item.itemId.startsWith(TROPHY_ITEM_PREFIX);
  const trophyId = isTrophy ? item.itemId.slice(TROPHY_ITEM_PREFIX.length) : null;
  const earned = trophyId ? state.trophies[trophyId] : undefined;
  const building = state.construction?.uid === item.uid ? state.construction : null;

  const remove = () => {
    const result = game.remove(item.uid);
    if (!result.ok) onNotice(errorText(result.error));
    onClose();
  };

  return (
    <Sheet title={nameOf(item.itemId)} onClose={onClose}>
      <div className="base-item-head">
        {trophyId ? (
          <ItemPreview trophyId={trophyId} verified={earned?.verified} size={72} />
        ) : (
          <ItemPreview itemId={item.itemId} level={Math.max(item.level, 1)} size={72} />
        )}
        <div className="base-item-text">
          {def?.kind === 'structure' && (
            <p className="base-item-level">
              {building ? g.setsLeft(building.setsRemaining) : g.level(item.level)}
            </p>
          )}
          {trophyId && earned ? (
            <>
              <p>{g.trophyNames[trophyId]?.proof(earned.value ?? 0)}</p>
              <p className="base-item-sub">{g.trophyShelf.earnedOn(dateFormat.format(new Date(earned.earnedAt)))}</p>
              {earned.verified && (
                <p className="base-trophy-verified">
                  <ShieldCheck size={14} strokeWidth={2.5} aria-hidden="true" />
                  {g.trophyShelf.verified}
                </p>
              )}
            </>
          ) : (
            <p>{g.items[item.itemId]?.description}</p>
          )}
        </div>
      </div>

      {def?.kind === 'structure' && item.level > 0 && (
        <BuildingRole item={item} game={game} onNotice={onNotice} />
      )}

      {def?.kind === 'structure' && !building && (
        <div className="base-upgrade">
          {item.level >= def.levels.length ? (
            <p className="base-item-sub">{g.maxLevel}</p>
          ) : (
            (() => {
              const blocker = upgradeBlocker(state, item.uid);
              const next = def.levels[item.level];
              return (
                <>
                  <div className="base-catalog-meta">
                    <CostList cost={next.cost} resources={state.resources} />
                    <span className="base-catalog-sets">{g.setsToBuild(next.sets)}</span>
                  </div>
                  <button
                    type="button"
                    className="base-primary-btn"
                    disabled={blocker !== null}
                    onClick={() => {
                      const result = game.upgrade(item.uid);
                      if (!result.ok) onNotice(errorText(result.error));
                      onClose();
                    }}>
                    {g.upgradeTo(item.level + 1)}
                  </button>
                  {blocker && <p className="base-catalog-blocker">{errorText(blocker)}</p>}
                </>
              );
            })()
          )}
        </div>
      )}

      <div className="base-item-actions">
        {item.itemId !== 'hq' && (
          <button type="button" className="base-secondary-btn" onClick={onMove}>
            <MoveIcon size={16} strokeWidth={2.5} aria-hidden="true" />
            {g.move}
          </button>
        )}
        {def?.kind === 'decor' && (
          <button type="button" className="base-secondary-btn" onClick={remove}>
            {g.remove} · {g.refund}
          </button>
        )}
        {isTrophy && (
          <button type="button" className="base-secondary-btn" onClick={remove}>
            {g.putAway}
          </button>
        )}
      </div>
    </Sheet>
  );
}

function BuildingRole({
  item,
  game,
  onNotice
}: {
  item: PlacedItem;
  game: BaseGame;
  onNotice: (text: string) => void;
}) {
  const { t } = useLanguage();
  const g = t.game;
  const { state, plan } = game;
  const nameOf = useExerciseName();
  const [from, setFrom] = useState<ResourceId>('iron');
  const [to, setTo] = useState<ResourceId>('timber');

  switch (item.itemId) {
    case 'hq': {
      const next = item.level + 1;
      return (
        <p className="base-role">
          {item.level >= MAX_HQ_LEVEL
            ? g.roles.hqMax
            : g.roles.hq(state.stats.weeksOnTarget, HQ_WEEKS_REQUIRED[next] ?? 0, next)}
        </p>
      );
    }
    case 'watchtower':
      return <p className="base-role">{g.roles.watchtower(questSlots(state))}</p>;
    case 'lodge':
      return <p className="base-role">{g.roles.lodge(state.shields, shieldCapacity(state))}</p>;
    case 'spring':
      return <p className="base-role">{g.roles.spring(structureLevel(state, 'spring'))}</p>;
    case 'yard':
      return (
        <div className="base-role">
          <p>{g.roles.yard(sessionBonusAmount(state, false))}</p>
          {plan?.isRestDay ? (
            <p className="base-item-sub">{g.yard.restDay}</p>
          ) : (
            <>
              <h3 className="base-quests-title">{g.yard.stationsTitle}</h3>
              <ul className="base-station-list">
                {(plan?.exercises ?? []).map((e) => (
                  <li key={e.id} className={e.done >= e.target ? 'is-done' : ''}>
                    <span>{nameOf(e.id)}</span>
                    <span className="tabular-nums">
                      {Math.min(e.done, e.target)}/{e.target}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      );
    case 'forge': {
      const rate = forgeRate(state) ?? 3;
      const out = 5;
      const pick = (value: ResourceId, onChange: (r: ResourceId) => void, label: string) => (
        <div className="base-forge-pick" role="radiogroup" aria-label={label}>
          <span className="base-forge-label">{label}</span>
          {RESOURCE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={value === id}
              aria-label={g.resources[id]}
              className={`base-forge-option ${value === id ? 'is-active' : ''}`}
              onClick={() => onChange(id)}>
              <ResourceIcon id={id} size={18} />
            </button>
          ))}
        </div>
      );
      return (
        <div className="base-role">
          <p>{g.roles.forge(rate)}</p>
          {pick(from, setFrom, g.forge.from)}
          {pick(to, setTo, g.forge.to)}
          <button
            type="button"
            className="base-primary-btn"
            disabled={from === to || state.resources[from] < rate * out}
            onClick={() => {
              const result = game.trade(from, to);
              if (!result.ok) onNotice(g.errors[result.error]);
            }}>
            <ResourceIcon id={from} size={16} />
            {g.forge.trade(rate * out, out)}
            <ResourceIcon id={to} size={16} />
          </button>
        </div>
      );
    }
    default:
      return null;
  }
}
