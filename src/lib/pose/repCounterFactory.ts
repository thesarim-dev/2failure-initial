import { createLungeRepCounter } from './lungeRepCounter';
import { PushupRepCounter } from './pushupRepCounter';
import { createSquatRepCounter } from './squatRepCounter';
import type { RepCounter } from './types';

export type PoseExerciseId = 'pushups' | 'squats' | 'lunges';

export function createRepCounter(exerciseId: PoseExerciseId): RepCounter {
  switch (exerciseId) {
    case 'pushups':
      return new PushupRepCounter();
    case 'squats':
      return createSquatRepCounter();
    case 'lunges':
      return createLungeRepCounter();
  }
}

export const POSE_AI_HINTS: Record<PoseExerciseId, string> = {
  pushups: 'Prop your phone to your side. Full pushup depth counts.',
  squats: 'Prop your phone to your side. Full squat depth counts.',
  lunges: 'Prop your phone to your side. Deep lunge on each rep counts.'
};

export const POSE_AI_CATEGORY_IDS = new Set<PoseExerciseId>([
  'pushups',
  'squats',
  'lunges'
]);

export function isPoseExerciseId(
  categoryId: string
): categoryId is PoseExerciseId {
  return POSE_AI_CATEGORY_IDS.has(categoryId as PoseExerciseId);
}
