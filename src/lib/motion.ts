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
