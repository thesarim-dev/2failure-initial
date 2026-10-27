import { useEffect, useRef, useState } from 'react';

/**
 * A departure-board digit. When the value changes it flips flap by flap to the
 * new number (4 → 5 is one flap, 3 → 6 is three). `riffle` (a counter) makes it
 * clack over once in place, as feedback for a tap. `rememberKey` keeps the last
 * shown value across visits, so a change made elsewhere (e.g. in Your plan)
 * plays as a flip when you come back.
 */
const FLAP_MS = 140;

export function SplitFlap({ value, riffle = 0, rememberKey }: { value: number; riffle?: number; rememberKey?: string }) {
  const [shown, setShown] = useState(() => {
    try {
      const saved = rememberKey ? Number(window.sessionStorage.getItem(rememberKey)) : NaN;
      return Number.isFinite(saved) && saved > 0 ? saved : value;
    } catch {
      return value;
    }
  });
  const [flip, setFlip] = useState<{ from: number; to: number; id: number } | null>(null);
  const ids = useRef(0);

  // Step one flap at a time towards the value.
  useEffect(() => {
    if (flip || shown === value) return;
    const to = shown + (value > shown ? 1 : -1);
    setFlip({ from: shown, to, id: ++ids.current });
  }, [value, shown, flip]);

  // A tap: one flap over, landing on the same number.
  const lastRiffle = useRef(riffle);
  useEffect(() => {
    if (riffle === lastRiffle.current) return;
    lastRiffle.current = riffle;
    if (!flip) setFlip({ from: shown, to: shown, id: ++ids.current });
  }, [riffle, flip, shown]);

  useEffect(() => {
    if (!flip) return;
    const timer = window.setTimeout(() => {
      setShown(flip.to);
      setFlip(null);
    }, FLAP_MS * 2);
    return () => window.clearTimeout(timer);
  }, [flip]);

  useEffect(() => {
    try {
      if (rememberKey && !flip) window.sessionStorage.setItem(rememberKey, String(shown));
    } catch {
      // Storage blocked: the change just won't animate next time.
    }
  }, [rememberKey, shown, flip]);

  const top = flip ? flip.to : shown;
  const bottom = flip ? flip.from : shown;
  return (
    <span className="flap" aria-hidden="true">
      <span className="flap-half flap-top">
        <b>{top}</b>
      </span>
      <span className="flap-half flap-bottom">
        <b>{bottom}</b>
      </span>
      {flip && (
        <>
          <span key={`a${flip.id}`} className="flap-half flap-top flap-fall">
            <b>{flip.from}</b>
          </span>
          <span key={`b${flip.id}`} className="flap-half flap-bottom flap-land">
            <b>{flip.to}</b>
          </span>
        </>
      )}
    </span>
  );
}
