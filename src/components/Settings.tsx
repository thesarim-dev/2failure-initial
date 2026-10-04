import { ReminderSettings } from './ReminderSettings';
import { SaveProgress } from './SaveProgress';
import { CalendarDays, Compass, LogOut, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { CoinsBadge } from './CoinsBadge';
import { SettingsFaq } from './SettingsFaq';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import type { Language } from '../i18n/types';

interface SettingsProps {
  coins: number;
  isDark: boolean;
  onToggleDark: () => void;
  weightUnit: 'kg' | 'lb';
  onWeightUnitChange: (unit: 'kg' | 'lb') => void;
  onReplayTour?: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
  /** Opens the Training screen on its Plan tab. */
  onOpenPlan: () => void;
  /** Demo build only: testing cheats. Undefined in the real app. */
  demoTools?: { addCoins: () => void; addMaterials: () => void; finishBuilds: () => void; unlockAll: () => void };
}

export function Settings({
  coins,
  isDark,
  onToggleDark,
  weightUnit,
  onWeightUnitChange,
  onReplayTour,
  soundOn,
  onToggleSound,
  onOpenPlan,
  demoTools
}: SettingsProps) {
  const { signOut, isGuest } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const s = t.settings;

  return (
    <div className="flex flex-col w-full min-h-full p-4 md:p-8 max-w-2xl mx-auto pb-24">
      <header className="flex justify-between items-center mb-8 gap-3">
        <h1 className="text-2xl md:text-3xl tracking-tighter store-title-glow text-[#00A8D8] dark:text-[#00B2FF] uppercase">
          {s.title}
        </h1>
        <CoinsBadge coins={coins} />
      </header>

      <div className="space-y-6">
        {isGuest && <SaveProgress where="settings" />}

        <section className="cyber-panel p-5 normal-case">
          <div className="settings-appearance-row">
            <div className="settings-appearance-copy">
              <h2 className="settings-section-title">{t.hub.settingsLink.title}</h2>
              <p className="text-sm font-medium opacity-70">{t.hub.settingsLink.description}</p>
            </div>
            <button type="button" onClick={onOpenPlan} className="settings-theme-toggle">
              <CalendarDays size={18} strokeWidth={2.35} />
              <span className="settings-theme-toggle__label">{t.hub.settingsLink.open}</span>
            </button>
          </div>
        </section>

        {demoTools && (
          <section className="cyber-panel p-5 normal-case demo-tools">
            <h2 className="settings-section-title">Demo tools</h2>
            <p className="text-sm font-medium opacity-70 mb-3">Only in the demo. Top up and unlock things to test the base.</p>
            <div className="demo-tools-grid">
              <button type="button" className="demo-tools-btn" onClick={demoTools.addCoins}>
                +10,000 coins
              </button>
              <button type="button" className="demo-tools-btn" onClick={demoTools.addMaterials}>
                +5,000 materials
              </button>
              <button type="button" className="demo-tools-btn" onClick={demoTools.finishBuilds}>
                Finish all builds
              </button>
              <button type="button" className="demo-tools-btn" onClick={demoTools.unlockAll}>
                Unlock trophies + weeks
              </button>
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
          <div className="settings-appearance-row">
            <div className="settings-appearance-copy">
              <h2 className="settings-section-title">{t.game.sound.title}</h2>
              <p className="text-sm font-medium opacity-70">{t.game.sound.description}</p>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              aria-pressed={soundOn}
              className="settings-theme-toggle">
              {soundOn ? <Volume2 size={18} strokeWidth={2.35} /> : <VolumeX size={18} strokeWidth={2.35} />}
              <span className="settings-theme-toggle__label">{soundOn ? t.game.sound.on : t.game.sound.off}</span>
            </button>
          </div>
        </section>

        <ReminderSettings />

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

        {onReplayTour && (
          <section className="cyber-panel p-5 normal-case">
            <h2 className="settings-section-title">{t.tutorial.replay.title}</h2>
            <p className="text-sm font-medium opacity-70 mb-4">
              {t.tutorial.replay.description}
            </p>
            <button
              type="button"
              onClick={onReplayTour}
              className="settings-action-btn settings-action-btn--tour">
              <Compass size={18} strokeWidth={2.5} aria-hidden="true" />
              {t.tutorial.replay.button}
            </button>
          </section>
        )}

        <SettingsFaq />

        <section className="cyber-panel p-5 normal-case">
          <h2 className="settings-section-title">{s.account.title}</h2>
          <p className="text-sm font-medium opacity-70 mb-4">
            {s.account.description}
          </p>
          <button
            type="button"
            onClick={() => {
              // Guests lose everything on sign-out; give them a chance to save first.
              if (isGuest && !window.confirm(t.hub.guest.signOutWarn)) return;
              void signOut();
            }}
            className="settings-action-btn settings-action-btn--signout">
            <LogOut size={18} strokeWidth={2.5} />
            {s.account.signOut}
          </button>
        </section>
      </div>
    </div>
  );
}
