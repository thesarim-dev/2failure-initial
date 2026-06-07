export type Point = { x: number; y: number; visibility?: number };

export type RepPhase = 'up' | 'down' | 'unknown';

export const MIN_VISIBILITY = 0.45;
export const STABLE_FRAMES = 4;

export interface RepCounter {
  reset(): void;
  update(landmarks: Point[]): number;
  readonly count: number;
}
