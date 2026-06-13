import { ArrowLeft, LogOut, Moon, Sun } from 'lucide-react';
import { CoinsBadge } from './CoinsBadge';
import { SettingsFaq } from './SettingsFaq';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import type { DailySetGoal } from '../hooks/useDailySetGoal';
import type { Language } from '../i18n/types';

interface SettingsProps {
  coins: number;
  dailySetGoal: DailySetGoal;
  isDark: boolean;
  onDailySetGoalChange: (goal: DailySetGoal) => void;
  onToggleDark: () => void;
  onBack: () => void;
}

export function Settings({
  coins,
  dailySetGoal,
  isDark,
  onDailySetGoalChange,
  onToggleDark,
  onBack
}: SettingsProps) {
  const { signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const s = t.settings;

  return (
    <div className="flex flex-col w-full min-h-full p-4 md:p-8 max-w-2xl mx-auto pb-24">
      <header className="flex justify-between items-center mb-8 gap-3">
        <button
          type="button"
          onClick={onBack}
          className="cyber-icon-btn cyber-icon-btn--back"
          aria-label={s.back}>
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="text-2xl md:text-3xl tracking-tighter store-title-glow text-[#00B2FF] normal-case">
          {s.title}
        </h1>
        <CoinsBadge coins={coins} />
      </header>

      <div className="space-y-6">
        <section className="cyber-panel p-5 normal-case">
          <h2 className="settings-section-title">{s.dailySetTarget.title}</h2>
          <p className="text-sm font-medium opacity-70 mb-4">
            {s.dailySetTarget.description}
          </p>
          <div className="flex gap-2">
            {([2, 3] as const).map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => onDailySetGoalChange(goal)}
                className={`store-btn flex-1 justify-center ${
                  dailySetGoal === goal
                    ? 'store-btn--active'
                    : 'store-btn--equip'
                }`}>
                {s.dailySetTarget.sets(goal)}
              </button>
            ))}
          </div>
        </section>

        <section className="cyber-panel p-5 normal-case">
          <h2 className="settings-section-title">{s.appearance.title}</h2>
          <p className="text-sm font-medium opacity-70 mb-4">
            {isDark ? s.appearance.nightOn : s.appearance.dayOn}
          </p>
          <button
            type="button"
            onClick={onToggleDark}
            className="settings-action-btn settings-action-btn--theme">
            {isDark ? (
              <>
                <Sun size={18} strokeWidth={2.5} />
                {s.appearance.switchToDay}
              </>
            ) : (
              <>
                <Moon size={18} strokeWidth={2.5} />
                {s.appearance.switchToNight}
              </>
            )}
          </button>
        </section>

        <section className="cyber-panel p-5 normal-case">
          <h2 className="settings-section-title">{s.language.title}</h2>
          <p className="text-sm font-medium opacity-70 mb-4">
            {s.language.description}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {LANGUAGE_OPTIONS.map((option: Language) => (
              <button
                key={option}
                type="button"
                onClick={() => setLanguage(option)}
                className={`store-btn flex-1 justify-center ${
                  language === option ? 'store-btn--active' : 'store-btn--equip'
                }`}>
                {s.language.options[option]}
              </button>
            ))}
          </div>
        </section>

        <SettingsFaq />

        <section className="cyber-panel p-5 normal-case">
          <h2 className="settings-section-title">{s.account.title}</h2>
          <p className="text-sm font-medium opacity-70 mb-4">
            {s.account.description}
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="settings-action-btn settings-action-btn--signout">
            <LogOut size={18} strokeWidth={2.5} />
            {s.account.signOut}
          </button>
        </section>
      </div>
    </div>
  );
}
