import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { track } from '../lib/analytics';
import type { ReminderSupport } from '../lib/notifications';

/**
 * The soft ask, shown once after the second set on day one: explain the value
 * first ("protect your flame"), then trigger the browser's permission popup
 * only if they say yes. On iPhone (not installed) it explains how to install.
 */
export function ReminderPrompt({
  support,
  onAllow,
  onLater
}: {
  support: ReminderSupport;
  onAllow: () => void;
  onLater: () => void;
}) {
  const { t } = useLanguage();
  const r = t.hub.reminders;
  const ios = support === 'ios-needs-install';
  useEffect(() => {
    track('reminders_prompt_shown', { ios });
  }, [ios]);
  return (
    <div className="reminder-root" role="dialog" aria-modal="true" aria-labelledby="reminder-title">
      <div className="reminder-backdrop" onClick={onLater} aria-hidden="true" />
      <motion.div
        className="reminder-card normal-case"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}>
        <span className="reminder-icon" aria-hidden="true">
          {ios ? <Smartphone size={26} strokeWidth={2.5} /> : <Bell size={26} strokeWidth={2.5} />}
        </span>
        <h2 id="reminder-title" className="reminder-title">
          {ios ? r.iosTitle : r.title}
        </h2>
        <p className="reminder-sub">{ios ? r.iosSub : r.sub}</p>
        {ios ? (
          <button type="button" className="reminder-btn is-primary" onClick={onLater}>
            {r.gotIt}
          </button>
        ) : (
          <>
            <button type="button" className="reminder-btn is-primary" onClick={onAllow}>
              {r.allow}
            </button>
            <button type="button" className="reminder-btn" onClick={onLater}>
              {r.later}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
