export type UserStats = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_workouts: number;
  last_workout_date: string | null;
  sets_progress_date: string | null;
};

export const USER_STATS_COLUMNS =
  'user_id, current_streak, longest_streak, total_workouts, last_workout_date, sets_progress_date';
