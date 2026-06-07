import { MIN_VISIBILITY, type Point } from './types';

export function isVisible(point: Point | undefined): point is Point {
  return !!point && (point.visibility ?? 1) >= MIN_VISIBILITY;
}

export function jointAngle(a: Point, b: Point, c: Point): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs((radians * 180) / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}
