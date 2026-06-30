import { ArrowLeft, LogOut, Moon, Sun } from 'lucide-react';
import { CoinsBadge } from './CoinsBadge';
import { SettingsFaq } from './SettingsFaq';
import { ProgramTrainingGuide } from './ProgramTrainingGuide';
import { ProgramDayCarousel } from './ProgramDayCarousel';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import type { DailySetGoal } from '../hooks/useDailySetGoal';
import type { Language } from '../i18n/types';
import type { RotatingProgramPhase } from '../lib/rotatingProgram';

interface SettingsProps {
  coins: number;
  dailySetGoal: DailySetGoal;
  rotatingProgramEnabled: boolean;
  rotatingProgramPhase: RotatingProgramPhase | null;
  rotatingProgramCycleDay: number | null;
  onSelectProgramCycleDay: (cycleDay: number) => void;
  isDark: boolean;
  onDailySetGoalChange: (goal: DailySetGoal) => void;
  onRotatingProgramEnabledChange: (enabled: boolean) => void;
  onToggleDark: () => void;
  weightUnit: 'kg' | 'lb';
  onWeightUnitChange: (unit: 'kg' | 'lb') => void;
  onBack: () => void;
}

export function Settings({
  coins,
  dailySetGoal,
  rotatingProgramEnabled,
  rotatingProgramPhase,
  rotatingProgramCycleDay,
  onSelectProgramCycleDay,
  isDark,
  onDailySetGoalChange,
  onRotatingProgramEnabledChange,
  onToggleDark,
  weightUnit,
  onWeightUnitChange,
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
        <h1 className="text-2xl md:text-3xl tracking-tighter store-title-glow text-[#00A8D8] dark:text-[#00B2FF] uppercase">
          {s.title}
        </h1>
        <CoinsBadge coins={coins} />
      </header>

      <div className="space-y-6">
        <section className="cyber-panel p-5 normal-case">
          <h2 className="settings-section-title">{s.rotatingProgram.title}</h2>
          <p className="text-sm font-medium opacity-70 mb-4">
            {s.rotatingProgram.description}
          </p>
          <div className="settings-toggle-group flex gap-2">
            <button
              type="button"
              onClick={() => onRotatingProgramEnabledChange(false)}
              className={`store-btn flex-1 justify-center ${
                !rotatingProgramEnabled
                  ? 'store-btn--active'
                  : 'store-btn--equip'
              }`}>
              {s.rotatingProgram.off}
            </button>
            <button
              type="button"
              onClick={() => onRotatingProgramEnabledChange(true)}
              className={`store-btn flex-1 justify-center ${
                rotatingProgramEnabled
                  ? 'store-btn--active'
                  : 'store-btn--equip'
              }`}>
              {s.rotatingProgram.on}
            </button>
          </div>
          {rotatingProgramEnabled &&
            rotatingProgramPhase !== null &&
            rotatingProgramCycleDay !== null && (
              <>
                <ProgramDayCarousel
                  cycleDay={rotatingProgramCycleDay}
                  onSelectCycleDay={onSelectProgramCycleDay}
                  getPhaseLabel={(phase) => s.rotatingProgram.phases[phase]}
                  isDark={isDark}
                />
                <ProgramTrainingGuide />
              </>
            )}
        </section>

        {!rotatingProgramEnabled && (
          <section className="cyber-panel p-5 normal-case">
            <h2 className="settings-section-title">{s.dailySetTarget.title}</h2>
            <p className="text-sm font-medium opacity-70 mb-4">
              {s.dailySetTarget.description}
            </p>
            <div className="settings-toggle-group flex gap-2">
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
        )}

        <section className="cyber-panel p-5 normal-case">
          <div className="settings-appearance-row">
            <div className="settings-appearance-copy">
              <h2 className="settings-section-title">{s.appearance.title}</h2>
              <p className="text-sm font-medium opacity-70">
                {isDark ? s.appearance.nightOn : s.appearance.dayOn}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleDark}
              className="settings-theme-toggle"
              aria-label={
                isDark ? s.appearance.switchToDay : s.appearance.switchToNight
              }
              title={
                isDark ? s.appearance.switchToDay : s.appearance.switchToNight
              }>
              {isDark ? (
                <>
                  <Sun size={18} strokeWidth={2.35} />
                  <span className="settings-theme-toggle__label">
                    {s.appearance.switchToDayButton}
                  </span>
                </>
              ) : (
                <>
                  <Moon size={18} strokeWidth={2.35} />
                  <span className="settings-theme-toggle__label">
                    {s.appearance.switchToNightButton}
                  </span>
                </>
              )}
            </button>
          </div>
        </section>

        <section className="cyber-panel p-5 normal-case">
          <h2 className="settings-section-title">{s.weightUnit.title}</h2>
          <p className="text-sm font-medium opacity-70 mb-4">
            {s.weightUnit.description}
          </p>
          <div className="settings-toggle-group flex gap-2">
            <button
              type="button"
              onClick={() => onWeightUnitChange('kg')}
              className={`store-btn flex-1 justify-center ${
                weightUnit === 'kg' ? 'store-btn--active' : 'store-btn--equip'
              }`}>
              {s.weightUnit.kg}
            </button>
            <button
              type="button"
              onClick={() => onWeightUnitChange('lb')}
              className={`store-btn flex-1 justify-center ${
                weightUnit === 'lb' ? 'store-btn--active' : 'store-btn--equip'
              }`}>
              {s.weightUnit.lb}
            </button>
          </div>
        </section>

        <section className="cyber-panel p-5 normal-case">
          <h2 className="settings-section-title">{s.language.title}</h2>
          <p className="text-sm font-medium opacity-70 mb-4">
            {s.language.description}
          </p>
          <div className="settings-toggle-group flex flex-col gap-2 sm:flex-row">
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
