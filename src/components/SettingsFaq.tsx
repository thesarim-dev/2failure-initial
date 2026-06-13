import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { FaqItemTranslation } from '../i18n/types';

function renderFaqAnswer(item: FaqItemTranslation) {
  if (item.list) {
    return (
      <>
        {item.list.intro && <p>{item.list.intro}</p>}
        <ul className="faq-answer-list">
          {item.list.items.map((entry) => (
            <li key={`${entry.label}-${entry.text}`}>
              <span className="faq-answer-label">{entry.label}</span> {entry.text}
            </li>
          ))}
        </ul>
      </>
    );
  }

  return item.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>);
}

function FaqAccordionItem({
  item,
  index,
  isOpen,
  onToggle
}: {
  item: FaqItemTranslation;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <div className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
      <button
        type="button"
        id={buttonId}
        className="faq-question-btn"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}>
        <span className="faq-question-text">{item.question}</span>
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
        <div className="faq-answer-content">{renderFaqAnswer(item)}</div>
      </div>
    </div>
  );
}

export function SettingsFaq() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="cyber-panel p-5 normal-case">
      <h2 className="settings-section-title">{t.settings.faq.title}</h2>
      <p className="text-sm font-medium opacity-70 mb-4">{t.settings.faq.description}</p>
      <div className="faq-list">
        {t.settings.faq.items.map((item, index) => (
          <FaqAccordionItem
            key={item.question}
            item={item}
            index={index}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </section>
  );
}
