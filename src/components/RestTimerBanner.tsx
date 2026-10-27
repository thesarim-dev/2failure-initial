import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fx } from '../lib/feedback';

export type RestTimer = {
  /** When the rest ends (ms since epoch). */
  endsAt: number;
  /** The full rest length in seconds (for the colour and the bar). */
  total: number;
  /** What's next: the same exercise, or the next one in the plan. */
  nextName: string;
  nextId: string;
  nextExercise: boolean;
};

/**
 * Rest between sets: a banner that drops down from the top of the screen and
 * stays there wherever you go. Its colour slides smoothly from green through
 * yellow to red as the rest runs out; at zero it chimes and offers the next set.
 */
export function RestTimerBanner({
  timer,
  onAdjust,
  onDismiss,
  onStart
}: {
  timer: RestTimer;
  onAdjust: (seconds: number) => void;
  onDismiss: () => void;
  onStart: () => void;
}) {
  const { t } = useLanguage();
  const r = t.rest;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);
  const remainingMs = Math.max(0, timer.endsAt - now);
  const remaining = Math.ceil(remainingMs / 1000);
  const done = remainingMs <= 0;
  // 0 → 1 as the rest runs out; the hue slides from green (135) to red (0).
  const used = Math.min(1, Math.max(0, 1 - remainingMs / (timer.total * 1000)));
  const hue = Math.round(135 * (1 - used));
  const colour = `hsl(${hue} 78% ${done ? 46 : 42}%)`;

  // A soft tick in the last few seconds, and a chime + buzz at zero (once).
  const chimed = useRef(false);
  const ticked = useRef(new Set<number>());
  useEffect(() => {
    if (done && !chimed.current) {
      chimed.current = true;
      fx.start();
      navigator.vibrate?.([120, 80, 120]);
    }
    if (!done) chimed.current = false;
    if (!done && remaining <= 3 && !ticked.current.has(remaining)) {
      ticked.current.add(remaining);
      fx.tick();
    }
  }, [done, remaining]);
  useEffect(() => {
    ticked.current = new Set();
  }, [timer.endsAt]);

  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, '0');
  return createPortal(
    <div className={`rest-banner ${done ? 'is-done' : ''}`} role="timer" aria-live="polite" style={{ '--rest': colour } as React.CSSProperties}>
      <div className="rest-banner-bar" style={{ transform: `scaleX(${1 - used})` }} aria-hidden="true" />
      <div className="rest-banner-main">
        <div className="rest-banner-text">
          <span className="rest-banner-kicker">{done ? r.over : r.resting}</span>
        </div>
        {done ? (
          <button type="button" className="rest-banner-start" onClick={onStart}>
            {r.start}
          </button>
        ) : (
          <div className="rest-banner-clock">
            <button type="button" className="rest-banner-adjust" onClick={() => onAdjust(-15)} aria-label={r.less}>
              <Minus size={14} strokeWidth={3} />
            </button>
            <span className="rest-banner-time tabular-nums">
              {mm}:{ss}
            </span>
            <button type="button" className="rest-banner-adjust" onClick={() => onAdjust(15)} aria-label={r.more}>
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        )}
        <button type="button" className="rest-banner-close" onClick={onDismiss} aria-label={r.skip}>
          <X size={16} strokeWidth={2.6} />
        </button>
      </div>
    </div>,
    document.body
  );
}
