import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { disableReminders, enableReminders, reminderPermission, reminderSupport, remindersActive } from '../lib/notifications';

/** Settings row: turn flame reminders on or off on this device. */
export function ReminderSettings() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const r = t.hub.reminders;
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const support = reminderSupport();
  const blocked = reminderPermission() === 'denied';

  useEffect(() => {
    void remindersActive().then(setActive);
  }, []);

  if (support === 'unsupported') return null;

  const toggle = async () => {
    if (!user || busy) return;
    setBusy(true);
    if (active) {
      await disableReminders();
      setActive(false);
    } else {
      const result = await enableReminders(user.id, language);
      setActive(result === 'granted');
    }
    setBusy(false);
  };

  return (
    <section className="cyber-panel p-5 normal-case">
      <div className="settings-appearance-row">
        <div className="settings-appearance-copy">
          <h2 className="settings-section-title">{r.settingsTitle}</h2>
          <p className="text-sm font-medium opacity-70">
            {support === 'ios-needs-install' ? r.iosSub : blocked ? r.blocked : r.settingsSub}
          </p>
        </div>
        {support === 'ok' && !blocked && (
          <button type="button" onClick={toggle} disabled={busy} aria-pressed={active} className="settings-theme-toggle">
            {active ? <Bell size={18} strokeWidth={2.35} /> : <BellOff size={18} strokeWidth={2.35} />}
            <span className="settings-theme-toggle__label">{active ? r.on : r.off}</span>
          </button>
        )}
      </div>
    </section>
  );
}
