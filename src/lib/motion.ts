import { useEffect, useRef, useState } from 'react';

/**
 * The app's motion vocabulary: a few durations, easings and springs used
 * everywhere, so movement feels like one consistent "physics".
 * CSS mirrors these as --dur-* / --ease-* (see index.css).
 */
export const DUR = { fast: 0.16, base: 0.28, slow: 0.45 } as const;
/** Smooth settle (decelerate) and a slight overshoot for playful pops. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;
/** Springs for framer-motion: snappy UI, bouncy rewards. */
export const SPRING_SNAPPY = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 } as const;
export const SPRING_BOUNCY = { type: 'spring', stiffness: 320, damping: 18 } as const;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * A number that animates from its previous value to the new one (ease-out),
 * e.g. coins counting up in the wallet. Returns [shown, isChanging].
 */
const lastShown = new Map<string, number>();

export function useCountFrom(target: number, durationMs = 700, memoryKey?: string): [number, boolean] {
  // With a memory key, a freshly mounted counter starts from what it last showed
  // (e.g. the wallet counts up when you return home after earning coins).
  const initial = memoryKey && lastShown.has(memoryKey) ? lastShown.get(memoryKey)! : target;
  const [shown, setShown] = useState(initial);
  const [changing, setChanging] = useState(false);
  const from = useRef(initial);
  useEffect(() => {
    if (memoryKey) lastShown.set(memoryKey, shown);
  }, [memoryKey, shown]);
  useEffect(() => {
    const start = from.current;
    if (start === target || prefersReducedMotion()) {
      from.current = target;
      setShown(target);
      return;
    }
    setChanging(true);
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(start + (target - start) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else {
        from.current = target;
        setChanging(false);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      from.current = target;
    };
  }, [target, durationMs]);
  return [shown, changing];
}
