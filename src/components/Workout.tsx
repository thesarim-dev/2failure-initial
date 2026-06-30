import React from 'react';
import { Move } from './moves';
import { isPoseAiTrackingEnabled } from '../config/features';
import { isPoseExerciseId } from '../lib/pose/repCounterFactory';
import { AiRepWorkout } from './AiRepWorkout';
import { TimedWorkout } from './TimedWorkout';

export interface WorkoutProps {
  move: Move;
  finishing?: boolean;
  onFinish: (duration: number, trackedReps?: number) => void;
  onCancel: () => void;
}

export function Workout({ move, finishing = false, onFinish, onCancel }: WorkoutProps) {
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
      finishing={finishing}
      onFinish={onFinish}
      onCancel={onCancel}
    />
  );
}
