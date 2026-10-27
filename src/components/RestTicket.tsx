import { useEffect, useRef, useState } from 'react';
import { Moon } from 'lucide-react';
import { fx } from '../lib/feedback';

/**
 * The rest day as a ticket you tear off: drag the zipper along the perforation
 * (forgivingly: about 60% of the way is enough, at any angle) and the top half
 * rips away, leaving the stub "Resting · Streak safe today". Tapping nudges the
 * zipper as a hint; the zipper is also a button for keyboards and screen readers.
 */

const TEAR_AT = 0.6;
/** A ragged edge across the ticket, as clip-path points (y in %). */
const ragged = (y: number, dir: 1 | -1) =>
  Array.from({ length: 13 }, (_, i) => `${(i / 12) * 100}% calc(${y}% ${i % 2 ? '+' : '-'} ${dir * 3}px)`).join(', ');
/** Keep everything above a ragged line at y%. */
const topHalf = (y: number) => `polygon(0% 0%, 100% 0%, ${ragged(y, 1).split(', ').reverse().join(', ')})`;

export function RestTicket({
  canTake,
  resting,
  left,
  slots,
  onTake,
  copy
}: {
  canTake: boolean;
  resting: boolean;
  left: number;
  /** How many tally marks to draw (rest days in the week). */
  slots: number;
  onTake: () => void;
  copy: { left: string; none: string; slide: string; restDay: string; safe: string; take: string };
}) {
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [tearing, setTearing] = useState(false);
  const [nudge, setNudge] = useState(false);
  const tileRef = useRef<HTMLDivElement>(null);
  const zipRef = useRef<HTMLDivElement>(null);
  const lastTick = useRef(0);
  const moved = useRef(false);
  const [perfY, setPerfY] = useState(60);
  // After a tear, the kept half drifts down to sit centred on the row.
  const [justTore, setJustTore] = useState(false);
  useEffect(() => {
    if (!resting || !justTore) return;
    const timer = window.setTimeout(() => setJustTore(false), 700);
    return () => window.clearTimeout(timer);
  }, [resting, justTore]);

  if (resting) {
    return (
      <span className="rest-ticket-wrap is-centred">
        <div className={`act-tile act-rest rest-ticket is-stub ${justTore ? 'is-settling' : ''}`} role="status" style={{ clipPath: topHalf(92) }}>
          <span className="stub-title">
            <Moon size={18} strokeWidth={2.5} className="rest-ticket-moon" aria-hidden="true" />
            {copy.restDay}
          </span>
          <span className="ticket-note">{copy.safe}</span>
        </div>
      </span>
    );
  }

  if (!canTake) {
    return (
      <span className="rest-ticket-wrap">
        <div className="act-tile act-rest rest-ticket is-spent" role="status">
          <span className="stub-title">
            <Moon size={18} strokeWidth={2.5} className="rest-ticket-moon" aria-hidden="true" />
            {copy.restDay}
          </span>
          <span className="ticket-note">{copy.none}</span>
        </div>
      </span>
    );
  }

  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const at = (clientX: number) => {
    const rect = tileRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const x = rtl ? rect.right - clientX : clientX - rect.left;
    return Math.min(1, Math.max(0, x / rect.width));
  };
  const tear = () => {
    if (tearing) return;
    const tile = tileRef.current;
    const zip = zipRef.current;
    if (tile && zip) setPerfY(((zip.offsetTop + zip.offsetHeight / 2) / tile.offsetHeight) * 100);
    setProgress(1);
    setTearing(true);
    setJustTore(true);
    fx.confirm();
    navigator.vibrate?.([30, 40, 60]);
    window.setTimeout(onTake, 650);
  };

  return (
    <span className="rest-ticket-wrap">
      <div
        ref={tileRef}
        className={`act-tile act-rest rest-ticket is-zip ${tearing ? 'is-torn' : ''} ${nudge ? 'is-nudge' : ''}`}
        style={tearing ? { clipPath: topHalf(perfY) } : undefined}
        onPointerDown={(e) => {
          if (tearing) return;
          moved.current = false;
          setDragging(true);
          e.currentTarget.setPointerCapture?.(e.pointerId);
          lastTick.current = 0;
        }}
        onPointerMove={(e) => {
          if (!dragging || tearing) return;
          const p = at(e.clientX);
          if (p > 0.08) moved.current = true;
          setProgress(p);
          // A soft zip click every ~12% of the way.
          if (Math.floor(p / 0.12) > lastTick.current) {
            lastTick.current = Math.floor(p / 0.12);
            fx.tick();
            navigator.vibrate?.(4);
          }
        }}
        onPointerUp={() => {
          if (tearing) return;
          setDragging(false);
          if (progress >= TEAR_AT) tear();
          else {
            setProgress(0);
            if (!moved.current) {
              // A tap: show which way to slide.
              setNudge(true);
              window.setTimeout(() => setNudge(false), 900);
            }
          }
        }}
        onPointerCancel={() => {
          setDragging(false);
          if (!tearing) setProgress(0);
        }}>
        <span className="stub-title">
          <Moon size={18} strokeWidth={2.5} className="rest-ticket-moon" aria-hidden="true" />
          {copy.restDay}
        </span>
        <span className="ticket-count">
          <span className="rest-tally" aria-hidden="true">
            {Array.from({ length: slots }, (_, k) => (
              <i key={k} className={k < left ? 'is-on' : ''} />
            ))}
          </span>
          {copy.left}
        </span>
        <div ref={zipRef} className={`ticket-zip ${dragging ? 'is-dragging' : ''}`} aria-hidden="false">
          <span className="zip-torn" style={{ width: `${progress * 100}%` }} />
          <button
            type="button"
            className="zip-pull"
            style={{ insetInlineStart: `calc(${progress * 100}% - 10px)` }}
            aria-label={copy.take}
            onClick={(e) => {
              // Keyboard / screen reader: Enter or Space tears it off.
              if (e.detail === 0) tear();
            }}
          />
        </div>
        <span className="ticket-note">{copy.slide}</span>
      </div>
      {tearing && (
        // The bottom half, falling away.
        <div className="act-tile act-rest rest-ticket ticket-flyaway" aria-hidden="true" style={{ clipPath: `polygon(${ragged(perfY, 1)}, 100% 100%, 0% 100%)` }}>
          <span className="stub-title">{copy.restDay}</span>
          <span className="ticket-count">{copy.left}</span>
          <span className="ticket-zip" />
          <span className="ticket-note">{copy.slide}</span>
        </div>
      )}
    </span>
  );
}
