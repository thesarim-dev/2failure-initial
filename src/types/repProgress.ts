export type PersonalBest = {
  reps: number | null;
  achievedAt: string | null;
};

export type SetRepResult = {
  reps: number;
  personalBest: PersonalBest;
  isNewPersonalBest: boolean;
};
