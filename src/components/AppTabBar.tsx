import { Activity, Castle, Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type AppTab = 'train' | 'base' | 'settings';

interface AppTabBarProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
  /** Something new is waiting in the base (trophy earned, build finished). */
  baseHasNews: boolean;
}

export function AppTabBar({ active, onChange, baseHasNews }: AppTabBarProps) {
  const { t } = useLanguage();
  const tabs: Array<{ id: AppTab; label: string; icon: typeof Activity }> = [
    { id: 'train', label: t.game.tabs.train, icon: Activity },
    { id: 'base', label: t.game.tabs.base, icon: Castle },
    { id: 'settings', label: t.hub.settingsTab, icon: SettingsIcon }
  ];

  return (
    <nav className="app-tab-bar" aria-label={tabs.map((tab) => tab.label).join(' / ')}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            className={`app-tab ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            data-tour={id === 'base' ? 'base-tab' : id === 'settings' ? 'settings' : undefined}
            onClick={() => onChange(id)}>
            <span className="app-tab-icon">
              <Icon size={22} strokeWidth={2.4} aria-hidden="true" />
              {id === 'base' && baseHasNews && !isActive && <span className="app-tab-dot" aria-hidden="true" />}
            </span>
            <span className="app-tab-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
