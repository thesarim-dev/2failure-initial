export type RirPrescriptionKey =
  | 'rir_1_2'
  | 'rir_1'
  | 'to_failure';

export function resolveSetTargets(
  categoryId: string,
  setNumber: number,
  dailySetGoal: number,
  programSetsToFailure: Record<string, number> | undefined,
  rotatingProgramEnabled: boolean
): { totalSets: number; rirKey: RirPrescriptionKey } {
  const resolvedTotal =
    rotatingProgramEnabled && programSetsToFailure?.[categoryId] !== undefined
      ? programSetsToFailure[categoryId]
      : dailySetGoal;

  const isThreeSetAnchor = resolvedTotal >= 3;

  let rirKey: RirPrescriptionKey;
  if (isThreeSetAnchor) {
    rirKey = setNumber < resolvedTotal ? 'rir_1_2' : 'to_failure';
  } else if (setNumber < resolvedTotal) {
    rirKey = 'rir_1';
  } else {
    rirKey = 'to_failure';
  }

  return { totalSets: resolvedTotal, rirKey };
}

export function detectSameDayFatigue(
  todaysSets: Array<{ weightKg: number; reps: number }>
): boolean {
  if (todaysSets.length < 3) return false;

  const first = todaysSets[0];
  const last = todaysSets[todaysSets.length - 1];

  if (Math.abs(first.weightKg - last.weightKg) > 0.01) return false;

  const repDrop = first.reps - last.reps;
  if (repDrop <= 0) return false;

  return repDrop >= 3 || repDrop / first.reps >= 0.25;
}
