import React from 'react';
import { Move } from './moves';
import { isPoseAiTrackingEnabled } from '../config/features';
import { isPoseExerciseId } from '../lib/pose/repCounterFactory';
import { AiRepWorkout } from './AiRepWorkout';
import { TimedWorkout } from './TimedWorkout';
import type { LastSet } from '../lib/lastSet';

export interface WorkoutProps {
  move: Move;
  finishing?: boolean;
  onFinish: (duration: number, trackedReps?: number) => void;
  onCancel: () => void;
  lastSet?: LastSet | null;
}

export function Workout({ move, finishing = false, onFinish, onCancel, lastSet = null }: WorkoutProps) {
  if (isPoseAiTrackingEnabled() && isPoseExerciseId(move.categoryId)) {
    return (
      <AiRepWorkout
        move={move}
        finishing={finishing}
        poseExerciseId={move.categoryId}
        onFinish={onFinish}
        onCancel={onCancel}
      />
    );
  }

  return (
    <TimedWorkout
      move={move}
      lastSet={lastSet}
      finishing={finishing}
      onFinish={onFinish}
      onCancel={onCancel}
    />
  );
}
