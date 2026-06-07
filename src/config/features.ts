/** Set VITE_ENABLE_POSE_AI=false (or legacy VITE_ENABLE_PUSHUP_AI=false) to disable AI rep tracking. */
export function isPoseAiTrackingEnabled(): boolean {
  const pose = import.meta.env.VITE_ENABLE_POSE_AI;
  if (pose !== undefined) return pose !== 'false';
  return import.meta.env.VITE_ENABLE_PUSHUP_AI !== 'false';
}

export function isPushupAiTrackingEnabled(): boolean {
  return isPoseAiTrackingEnabled();
}
