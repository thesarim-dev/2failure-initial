import React from 'react';
import { Move } from './moves';
import { isPoseAiTrackingEnabled } from '../config/features';
import { isPoseExerciseId } from '../lib/pose/repCounterFactory';
import { AiRepWorkout } from './AiRepWorkout';
import { TimedWorkout } from './TimedWorkout';

export interface WorkoutProps {
  move: Move;
  onFinish: (duration: number, trackedReps?: number) => void;
  onCancel: () => void;
}

export function Workout({ move, onFinish, onCancel }: WorkoutProps) {
  if (isPoseAiTrackingEnabled() && isPoseExerciseId(move.categoryId)) {
    return (
      <AiRepWorkout
        move={move}
        poseExerciseId={move.categoryId}
        onFinish={onFinish}
        onCancel={onCancel}
      />
    );
  }

  return (
    <TimedWorkout move={move} onFinish={onFinish} onCancel={onCancel} />
  );
}
