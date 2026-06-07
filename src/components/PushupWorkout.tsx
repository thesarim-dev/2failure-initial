import { AiRepWorkout } from './AiRepWorkout';
import type { Move } from './moves';

interface PushupWorkoutProps {
  move: Move;
  onFinish: (duration: number, trackedReps?: number) => void;
  onCancel: () => void;
}

/** @deprecated Use AiRepWorkout with poseExerciseId="pushups". */
export function PushupWorkout(props: PushupWorkoutProps) {
  return <AiRepWorkout {...props} poseExerciseId="pushups" />;
}
