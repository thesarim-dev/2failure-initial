import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function ProgramTrainingGuide() {
  const { t } = useLanguage();
  const guide = t.settings.rotatingProgram.trainingGuide;
  const [isOpen, setIsOpen] = useState(false);
  const panelId = 'program-training-guide-panel';
  const buttonId = 'program-training-guide-button';

  return (
    <div className={`faq-item mt-4 ${isOpen ? 'faq-item--open' : ''}`}>
      <button
        type="button"
        id={buttonId}
        className="faq-question-btn"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={panelId}>
        <span className="faq-question-text">{guide.toggleLabel}</span>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          className="faq-chevron shrink-0"
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="faq-answer-panel"
        hidden={!isOpen}>
        <div className="faq-answer-content program-training-guide">
          {guide.sections.map((section) => (
            <div key={section.title} className="program-training-section">
              <p className="program-training-section-title">{section.title}</p>
              <ul className="faq-answer-list">
                {section.items.map((item) => (
                  <li key={`${section.title}-${item.label}`}>
                    <span className="faq-answer-label">{item.label}</span> {item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
