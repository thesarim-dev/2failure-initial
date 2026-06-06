import React from 'react';
import { Move } from './moves';
import { isPushupAiTrackingEnabled } from '../config/features';
import { PushupWorkout } from './PushupWorkout';
import { TimedWorkout } from './TimedWorkout';

export interface WorkoutProps {
  move: Move;
  onFinish: (duration: number, trackedReps?: number) => void;
  onCancel: () => void;
}

export function Workout({ move, onFinish, onCancel }: WorkoutProps) {
  if (move.categoryId === 'pushups' && isPushupAiTrackingEnabled()) {
    return (
      <PushupWorkout move={move} onFinish={onFinish} onCancel={onCancel} />
    );
  }

  return (
    <TimedWorkout move={move} onFinish={onFinish} onCancel={onCancel} />
  );
}
