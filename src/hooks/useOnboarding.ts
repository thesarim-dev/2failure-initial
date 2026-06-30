import { useCallback, useEffect, useState } from 'react';
import { hasSeenOnboarding, markOnboardingSeen } from '../lib/onboarding';

export function useOnboarding(userId: string | undefined) {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!userId) {
      setShowTutorial(false);
      return;
    }

    setShowTutorial(!hasSeenOnboarding(userId));
  }, [userId]);

  const dismissTutorial = useCallback(() => {
    if (userId) {
      markOnboardingSeen(userId);
    }
    setShowTutorial(false);
  }, [userId]);

  return { showTutorial, dismissTutorial };
}
