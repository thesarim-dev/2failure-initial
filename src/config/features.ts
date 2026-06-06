/** Set VITE_ENABLE_PUSHUP_AI=false to disable camera/AI rep tracking for pushups. */
export function isPushupAiTrackingEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_PUSHUP_AI !== 'false';
}
