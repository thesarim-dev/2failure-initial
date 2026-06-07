import { usePoseRepTracker } from './usePoseRepTracker';

/** @deprecated Use usePoseRepTracker with exerciseId instead. */
export function usePushupTracker(enabled: boolean) {
  return usePoseRepTracker(enabled, 'pushups');
}

export type { TrackerStatus, CameraFacing } from './usePoseRepTracker';
