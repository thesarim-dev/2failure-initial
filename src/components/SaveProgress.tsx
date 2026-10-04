import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import { track } from '../lib/analytics';

/**
 * For guests: turn the anonymous account into a real one. Linking keeps the
 * same account id, so every set, coin, streak day and building stays.
 */
export function SaveProgress({ where }: { where: 'receipt' | 'settings' }) {
  const { isGuest } = useAuth();
  const { t } = useLanguage();
  const g = t.hub.guest;
  const [mode, setMode] = useState<'choose' | 'email' | 'sent' | 'saved'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isGuest && mode !== 'sent' && mode !== 'saved') return null;

  const withGoogle = async () => {
    setBusy(true);
    setError(null);
    track('guest_upgrade_start', { method: 'google', where });
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: getAuthRedirectUrl() }
    });
    if (linkError) {
      setError(g.error);
      setBusy(false);
    }
  };

  const withEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    track('guest_upgrade_start', { method: 'email', where });
    const { data, error: updateError } = await supabase.auth.updateUser({ email, password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message || g.error);
      return;
    }
    // Supabase sends a confirmation email; the account becomes permanent once confirmed.
    setMode(data.user && !data.user.is_anonymous ? 'saved' : 'sent');
  };

  return (
    <section className={`save-progress save-progress--${where} normal-case`} aria-labelledby={`save-progress-${where}`}>
      <div className="save-progress-head">
        <ShieldCheck size={20} strokeWidth={2.5} aria-hidden="true" />
        <h2 id={`save-progress-${where}`} className="save-progress-title">
          {mode === 'saved' ? g.saved : g.saveTitle}
        </h2>
      </div>
      {mode === 'sent' ? (
        <p className="save-progress-sub">{g.checkInbox}</p>
      ) : mode === 'saved' ? null : (
        <>
          <p className="save-progress-sub">{g.saveSub}</p>
          {mode === 'choose' ? (
            <div className="save-progress-actions">
              <button type="button" className="save-progress-btn is-primary" onClick={withGoogle} disabled={busy}>
                {g.google}
              </button>
              <button type="button" className="save-progress-btn" onClick={() => setMode('email')} disabled={busy}>
                {g.email}
              </button>
            </div>
          ) : (
            <form className="save-progress-form" onSubmit={withEmail}>
              <label className="save-progress-label">
                {g.emailLabel}
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </label>
              <label className="save-progress-label">
                {g.passwordLabel}
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </label>
              <button type="submit" className="save-progress-btn is-primary" disabled={busy}>
                {g.saveEmail}
              </button>
            </form>
          )}
          {error && (
            <p className="save-progress-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}
