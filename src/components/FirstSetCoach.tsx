import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type FirstSetStage = 'workout' | 'repPrompt' | 'weightPrompt' | 'summary';

interface FirstSetCoachProps {
  stage: FirstSetStage;
}

/**
 * Small, non-blocking tip shown during the user's first guided set.
 * Sits at the bottom on the workout and logging screens (their lower half
 * is empty) and at the top on the summary, where the bottom holds "back home".
 */
export function FirstSetCoach({ stage }: FirstSetCoachProps) {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState(false);

  useEffect(() => setHidden(false), [stage]);

  if (hidden) return null;

  // Written out in full so Tailwind keeps both classes in the build.
  const placementClass =
    stage === 'summary' ? 'first-set-coach--top' : 'first-set-coach--bottom';

  return (
    <div
      className={`first-set-coach ${placementClass} cyber-panel normal-case`}
      role="status"
      aria-live="polite">
      <span className="first-set-coach-dot" aria-hidden="true" />
      <p className="first-set-coach-text">{t.tutorial.firstSet[stage]}</p>
      <button
        type="button"
        className="first-set-coach-close"
        onClick={() => setHidden(true)}
        aria-label={t.tutorial.firstSet.dismiss}>
        <X size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
