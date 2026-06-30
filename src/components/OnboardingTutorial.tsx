import { useState } from 'react';
import { ArrowRight, ChevronLeft, Skull } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const { t } = useLanguage();
  const tutorial = t.tutorial;
  const [stepIndex, setStepIndex] = useState(0);
  const totalSteps = tutorial.steps.length;
  const step = tutorial.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  const handleFinish = () => {
    onComplete();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
      return;
    }
    setStepIndex((index) => index + 1);
  };

  return (
    <div
      className="onboarding-backdrop"
      role="presentation"
      onClick={handleFinish}>
      <div
        className="onboarding-panel cyber-panel normal-case"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-body"
        onClick={(event) => event.stopPropagation()}>
        <div className="onboarding-header">
          <Skull
            size={28}
            strokeWidth={2.5}
            className="onboarding-skull shrink-0"
            aria-hidden="true"
          />
          <p className="onboarding-kicker">
            {tutorial.stepLabel(stepIndex + 1, totalSteps)}
          </p>
        </div>

        <h2 id="onboarding-title" className="onboarding-title">
          {step.title}
        </h2>
        <p id="onboarding-body" className="onboarding-body">
          {step.body}
        </p>

        <div className="onboarding-dots" aria-hidden="true">
          {tutorial.steps.map((_, index) => (
            <span
              key={index}
              className={`onboarding-dot ${index === stepIndex ? 'onboarding-dot--active' : ''}`}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          <button
            type="button"
            onClick={handleFinish}
            className="onboarding-skip">
            {tutorial.skip}
          </button>

          <div className="onboarding-nav">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIndex((index) => index - 1)}
                className="store-btn store-btn--equip onboarding-nav-btn">
                <ChevronLeft size={16} strokeWidth={2.5} />
                {tutorial.back}
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="store-btn store-btn--active onboarding-nav-btn onboarding-nav-btn--primary">
              {isLast ? tutorial.finish : tutorial.next}
              {!isLast && <ArrowRight size={16} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
