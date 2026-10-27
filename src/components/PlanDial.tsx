import { useEffect, useState } from 'react';

/**
 * Your plan as a dial: the days a week in the middle of a ring of seven
 * segments (one per day), training days lit. When the days change, the
 * segments light up or fade one by one; `spin` (a counter) gives the ring a
 * quick turn as feedback for a tap.
 */
const R = 25;
const GAP = 10; // degrees between segments

function arc(i: number): string {
  const span = 360 / 7;
  const a0 = ((i * span + GAP / 2 - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * span - GAP / 2 - 90) * Math.PI) / 180;
  const p = (a: number) => `${(32 + Math.cos(a) * R).toFixed(2)} ${(32 + Math.sin(a) * R).toFixed(2)}`;
  return `M ${p(a0)} A ${R} ${R} 0 0 1 ${p(a1)}`;
}

export function PlanDial({ days, spin = 0, rememberKey }: { days: number; spin?: number; rememberKey?: string }) {
  // Start from the last value shown, so a change made in Your plan animates on return.
  const [lit, setLit] = useState(() => {
    try {
      const saved = rememberKey ? Number(window.sessionStorage.getItem(rememberKey)) : NaN;
      return Number.isFinite(saved) && saved > 0 ? saved : days;
    } catch {
      return days;
    }
  });
  useEffect(() => {
    const timer = window.setTimeout(() => setLit(days), 60);
    try {
      if (rememberKey) window.sessionStorage.setItem(rememberKey, String(days));
    } catch {
      // Storage blocked: the change just won't animate next time.
    }
    return () => window.clearTimeout(timer);
  }, [days, rememberKey]);

  return (
    <svg viewBox="0 0 64 64" className="plan-dial" aria-hidden="true">
      <g key={spin} className={spin ? 'plan-dial-ring is-spin' : 'plan-dial-ring'}>
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={arc(i)} className={i < lit ? 'dial-seg is-on' : 'dial-seg'} style={{ transitionDelay: `${i * 70}ms` }} />
        ))}
      </g>
      <text x="32" y="33" className="plan-dial-n" textAnchor="middle" dominantBaseline="central">
        {days}
      </text>
    </svg>
  );
}
