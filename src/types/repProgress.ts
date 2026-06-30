export type PersonalBest = {
  reps: number | null;
  achievedAt: string | null;
};

export type WeightPersonalBest = {
  weightKg: number | null;
  reps: number | null;
  achievedAt: string | null;
};

export type ProgressionHintKind =
  | 'increase'
  | 'maintain'
  | 'decrease'
  | 'baseline'
  | 'fatigue_maintain';

export type ProgressionHint = {
  kind: ProgressionHintKind;
  suggestedWeightKg: number | null;
};

export type SetRepResult = {
  reps: number;
  weightKg?: number | null;
  personalBest: PersonalBest;
  weightPersonalBest?: WeightPersonalBest | null;
  isNewPersonalBest: boolean;
  isNewWeightPersonalBest?: boolean;
  progression?: ProgressionHint | null;
};

export type LastWeightedSet = {
  weightKg: number;
  reps: number;
  completedAt: string;
};
