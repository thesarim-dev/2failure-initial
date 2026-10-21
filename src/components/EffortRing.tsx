import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { calculateCoinsEarned, EFFORT_FULL_SECONDS, MIN_SET_SECONDS } from '../lib/coinRewards';
import { fx } from '../lib/feedback';
import { SPRING_BOUNCY } from '../lib/motion';

/**
 * The workout's hero: an effort ring that fills toward the full effort bonus
 * (60 s), with the timer and the coins this set is already worth inside it.
 * Milestones at 10 s (coins start), 30 s and 60 s get a small celebration;
 * a slow halo breathes behind it. When the set ends the ring snaps full.
 */

const R = 104;
const C = 2 * Math.PI * R;

export function EffortRing({
  seconds,
  tier = 'BASE',
  done = false
}: {
  seconds: number;
  tier?: 'BASE' | 'PRO' | 'ELITE';
  /** The set just ended: snap the ring full with a flash. */
  done?: boolean;
}) {
  const { t } = useLanguage();
  const h = t.workout.hero;
  const coins = calculateCoinsEarned(seconds, tier);
  const progress = done ? 1 : Math.min(1, seconds / EFFORT_FULL_SECONDS);
  const overtime = seconds >= EFFORT_FULL_SECONDS;
  const markAngle = (MIN_SET_SECONDS / EFFORT_FULL_SECONDS) * 2 * Math.PI - Math.PI / 2;

  // Milestone moments, each once per set.
  const [milestone, setMilestone] = useState<string | null>(null);
  const shown = useRef(new Set<number>());
  useEffect(() => {
    const hit = (at: number, text: string, play: () => void) => {
      if (seconds >= at && !shown.current.has(at)) {
        shown.current.add(at);
        setMilestone(text);
        play();
        window.setTimeout(() => setMilestone((m) => (m === text ? null : m)), 2400);
      }
    };
    hit(MIN_SET_SECONDS, h.unlocked, () => fx.coin());
    hit(30, h.halfway, () => fx.tick());
    hit(EFFORT_FULL_SECONDS, h.maxed, () => fx.record());
  }, [seconds, h]);

  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');

  return (
    <div className={`effort-ring ${overtime ? 'is-overtime' : ''} ${done ? 'is-done' : ''}`}>
      <div className="effort-ring-milestone" aria-live="polite">
        <AnimatePresence>
          {milestone && (
            <motion.span
              key={milestone}
              className="effort-ring-toast"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SPRING_BOUNCY}>
              {milestone}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="effort-ring-stage">
        <span className="effort-ring-breathe" aria-hidden="true" />
        <svg viewBox="0 0 260 260" className="effort-ring-svg" aria-hidden="true">
          <circle cx={130} cy={130} r={R} className="effort-ring-track" />
          <circle
            cx={130}
            cy={130}
            r={R}
            className="effort-ring-fill"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            transform="rotate(-90 130 130)"
          />
          {/* Where coins start counting (10 s). */}
          <circle cx={130 + Math.cos(markAngle) * R} cy={130 + Math.sin(markAngle) * R} r={5} className="effort-ring-mark" />
        </svg>
        <div className="effort-ring-center">
          <span className="effort-ring-time tabular-nums">
            {mm}:{ss}
          </span>
          {coins > 0 ? (
            <motion.span key={coins} className="effort-ring-coins" initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={SPRING_BOUNCY}>
              <Coins size={16} strokeWidth={2.6} aria-hidden="true" />
              {h.coins(coins)}
            </motion.span>
          ) : (
            <span className="effort-ring-hint">{h.startsAt}</span>
          )}
        </div>
      </div>
      {/* Space is always reserved, so nothing jumps when this appears. */}
      <p className="effort-ring-overtime" style={{ visibility: overtime && !done ? 'visible' : 'hidden' }}>
        {h.overtime}
      </p>
    </div>
  );
}
