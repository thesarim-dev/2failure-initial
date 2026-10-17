import { motion } from 'framer-motion';
import { CalendarCheck, Check, ChevronRight, Expand, HardHat, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { ResourceId } from '../../game/catalog';
import { goalProgress, reqMet, setsFor, type Goal, type GoalReq } from '../../game/goals';
import { ItemPreview } from './BaseBoard';
import { ResourceIcon } from './BaseScreen';

const SET_KIND: Record<ResourceId, 'upper' | 'legs' | 'core'> = { stone: 'upper', timber: 'legs', crystal: 'core' };

/**
 * "Next up": the player's next goals, in order. The first is shown in full
 * with a checklist of exactly what's missing (and about how many sets that
 * is); the rest are compact rows. Ready goals get a one-tap action.
 */
export function GoalsCard({
  goals,
  coins,
  totalBuilders,
  nameOf,
  titleOf,
  onAction
}: {
  goals: Goal[];
  coins: number;
  totalBuilders: number;
  nameOf: (itemId: string) => string;
  titleOf: (title: string) => string;
  onAction: (goal: Goal) => void;
}) {
  const { t } = useLanguage();
  const q = t.game.goals;
  if (!goals.length) return null;

  const titleFor = (goal: Goal) => {
    switch (goal.kind) {
      case 'construction':
        return goal.targetLevel > 1 ? q.upgrading(nameOf(goal.itemId), goal.targetLevel) : q.building(nameOf(goal.itemId));
      case 'upgrade':
        return q.upgrade(nameOf(goal.itemId), goal.targetLevel);
      case 'build':
        return q.build(nameOf(goal.itemId));
      case 'level':
        return q.reach(titleOf(goal.title));
      case 'land':
        return q.land;
    }
  };
  const subFor = (goal: Goal) => {
    switch (goal.kind) {
      case 'construction':
        return q.setsToGo(goal.setsTotal - goal.setsDone);
      case 'upgrade':
      case 'build':
        return q.benefit[goal.itemId] ?? '';
      case 'level':
        return goal.unlocks.length
          ? `${q.pointsToGo(goal.next - goal.score)} · ${q.unlocks(goal.unlocks.slice(0, 3).map(nameOf).join(', '))}`
          : q.pointsToGo(goal.next - goal.score);
      case 'land':
        return q.landSub(goal.cost);
    }
  };
  const isReady = (goal: Goal) => (goal.kind === 'upgrade' || goal.kind === 'build' || goal.kind === 'land' ? goal.ready : false);
  const actionLabel = (goal: Goal) =>
    goal.kind === 'build'
      ? q.action.build
      : goal.kind === 'upgrade'
        ? goal.ready
          ? q.action.upgrade
          : q.action.view
        : goal.kind === 'land'
          ? q.action.land
          : goal.kind === 'level'
            ? q.action.decorate
            : null;

  const icon = (goal: Goal, size: number) => {
    if (goal.kind === 'level') {
      return (
        <span className="goal-icon goal-icon--level" style={{ width: size, height: size }} aria-hidden="true">
          {goal.level}
        </span>
      );
    }
    if (goal.kind === 'land') {
      return (
        <span className="goal-icon goal-icon--land" style={{ width: size, height: size }} aria-hidden="true">
          <Expand size={size * 0.45} strokeWidth={2.5} />
        </span>
      );
    }
    const level = goal.kind === 'build' ? 1 : goal.targetLevel;
    return (
      <span className="goal-icon" style={{ width: size, height: size }} aria-hidden="true">
        <ItemPreview itemId={goal.itemId} level={level} size={size} />
      </span>
    );
  };

  const reqRow = (req: GoalReq, i: number) => {
    const met = reqMet(req);
    let label: string;
    let hint: string | null = null;
    let glyph = null;
    if (req.kind === 'resource') {
      glyph = <ResourceIcon id={req.id} size={18} />;
      label = `${Math.min(req.have, req.need)}/${req.need}`;
      if (!met) hint = q.aboutSets(setsFor(req), SET_KIND[req.id]);
    } else if (req.kind === 'coins') {
      glyph = <span className="goal-coin" aria-hidden="true">¢</span>;
      label = `${Math.min(req.have, req.need)}/${req.need} ${q.coins}`;
      if (!met) hint = q.aboutSets(setsFor(req), 'any');
    } else if (req.kind === 'builders') {
      glyph = <HardHat size={16} strokeWidth={2.5} aria-hidden="true" />;
      label = q.builders(req.need);
      if (!met) hint = totalBuilders < req.need ? q.needLodge : q.buildersBusy;
    } else {
      glyph = <CalendarCheck size={16} strokeWidth={2.5} aria-hidden="true" />;
      label = q.weeks(req.need);
      if (!met) hint = q.weeksLeft(req.need - req.have);
    }
    return (
      <li key={i} className={`goal-req ${met ? 'is-met' : ''}`}>
        <span className="goal-req-glyph">{glyph}</span>
        <span className="goal-req-label tabular-nums">{label}</span>
        {met ? (
          <Check size={15} strokeWidth={3.5} className="goal-req-check" aria-hidden="true" />
        ) : (
          <span className="goal-req-hint">{hint}</span>
        )}
      </li>
    );
  };

  const [main, ...rest] = goals;
  const mainReady = isReady(main);
  const mainAction = actionLabel(main);
  void coins;

  return (
    <section className="goals normal-case" aria-labelledby="goals-title">
      <h2 id="goals-title" className="goals-title">
        <Sparkles size={16} strokeWidth={2.75} aria-hidden="true" />
        {q.title}
      </h2>

      <motion.div
        key={`${main.kind}-${'itemId' in main ? main.itemId : ''}`}
        className={`goal-main ${mainReady ? 'is-ready' : ''}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}>
        <div className="goal-main-head">
          {icon(main, 64)}
          <div className="goal-main-text">
            <span className="goal-main-title">{titleFor(main)}</span>
            <span className="goal-main-sub">{subFor(main)}</span>
          </div>
          {mainReady && <span className="goal-ready-pill">{q.ready}</span>}
        </div>
        <div className="goal-bar" aria-hidden="true">
          <motion.span
            className="goal-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(goalProgress(main) * 100)}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
        {'reqs' in main && <ul className="goal-reqs">{main.reqs.map(reqRow)}</ul>}
        {main.kind === 'level' && <p className="goal-main-note">{q.pointsHow}</p>}
        {mainAction && (
          <button type="button" className={`goal-action ${mainReady ? 'is-primary' : ''}`} onClick={() => onAction(main)}>
            {mainAction}
            <ChevronRight size={16} strokeWidth={3} className="tour-icon-flip" aria-hidden="true" />
          </button>
        )}
      </motion.div>

      {rest.length > 0 && (
        <ul className="goal-list">
          {rest.map((goal, i) => {
            const ready = isReady(goal);
            const actionable = actionLabel(goal) !== null;
            return (
              <li key={`${goal.kind}-${i}`}>
                <button
                  type="button"
                  className={`goal-row ${ready ? 'is-ready' : ''}`}
                  disabled={!actionable}
                  onClick={() => onAction(goal)}>
                  {icon(goal, 40)}
                  <span className="goal-row-text">
                    <span className="goal-row-title">{titleFor(goal)}</span>
                    <span className="goal-row-bar" aria-hidden="true">
                      <span style={{ width: `${Math.round(goalProgress(goal) * 100)}%` }} />
                    </span>
                  </span>
                  {ready ? (
                    <span className="goal-ready-pill">{q.ready}</span>
                  ) : actionable ? (
                    <ChevronRight size={18} strokeWidth={2.75} className="goal-row-go tour-icon-flip" aria-hidden="true" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
