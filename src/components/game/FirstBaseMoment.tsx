import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { GameState, TodayPlan } from '../../game/engine';
import type { ResourceId } from '../../game/catalog';
import { useLanguage } from '../../context/LanguageContext';
import { BaseBoard } from './BaseBoard';
import { ResourceIcon } from './BaseScreen';

/**
 * The first-receipt "aha": a live mini view of the player's own base with the
 * materials they just earned flying into it, and a button to go build.
 */
export function FirstBaseMoment({
  state,
  plan,
  earned,
  onOpenBase
}: {
  state: GameState;
  plan: TodayPlan | null;
  earned: Array<[ResourceId, number]>;
  onOpenBase: () => void;
}) {
  const { t } = useLanguage();
  const reduce = useReducedMotion() ?? false;
  return (
    <section className="first-base normal-case" aria-labelledby="first-base-title">
      <div className="first-base-board" aria-hidden="true">
        <BaseBoard
          state={state}
          plan={plan}
          lit
          selectedUid={null}
          validTiles={null}
          labelForItem={() => ''}
          onTile={() => undefined}
          onItem={() => undefined}
          tileLabel={() => ''}
        />
        {/* Materials fly in from the receipt and land on the plot. */}
        {earned.map(([id, amount], i) => (
          <motion.span
            key={id}
            className="first-base-fly"
            initial={reduce ? false : { opacity: 0, x: (i - 1) * 60, y: 90, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], x: (i - 1) * 18, y: [90, -10, 0, 0], scale: [0.6, 1.3, 1, 0.9] }}
            transition={{ duration: 1.6, delay: 0.5 + i * 0.25, times: [0, 0.45, 0.7, 1] }}>
            <ResourceIcon id={id} size={26} />
            <span className="first-base-fly-amount">+{amount}</span>
          </motion.span>
        ))}
      </div>
      <h2 id="first-base-title" className="first-base-title">
        {t.hub.firstBase.title}
      </h2>
      <p className="first-base-sub">{t.hub.firstBase.sub}</p>
      <button type="button" className="first-base-cta" onClick={onOpenBase}>
        {t.hub.firstBase.open}
        <ArrowRight size={16} strokeWidth={2.75} className="tour-icon-flip" aria-hidden="true" />
      </button>
    </section>
  );
}
