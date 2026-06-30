import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { FailureLogo } from './FailureLogo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatOAuthError } from '../lib/authErrors';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import { supabase } from '../lib/supabase';

function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.13 13.72 17.57 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

interface LoginProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export function Login({ isDark, onToggleDark }: LoginProps) {
  const { authError, refreshSession } = useAuth();
  const { language, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<
    'signIn' | 'signUp' | 'google' | null
  >(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting('signIn');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) throw signInError;
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.login.errors.signIn);
    } finally {
      setSubmitting(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting('google');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthRedirectUrl()
        }
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t.login.errors.signInGmail;
      setError(formatOAuthError(message, language));
      setSubmitting(null);
    }
  };

  const handleSignUp = async () => {
    setError(null);
    setSubmitting('signUp');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });
      if (signUpError) throw signUpError;

      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }

      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.login.errors.signUp);
    } finally {
      setSubmitting(null);
    }
  };

  const busy = submitting !== null;
  const screenClass = isDark ? 'login-screen' : 'login-screen login-screen--light';

  return (
    <div
      className={`${screenClass} min-h-screen w-full flex flex-col p-4 md:p-8 relative`}>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="flex flex-col items-center gap-3 mb-8 w-full">
          <div className="flex items-center gap-3">
            <FailureLogo size={44} className="failure-logo-glow shrink-0" />
            <h1 className="logo-brand text-4xl md:text-5xl tracking-tighter text-[#00A8D8] dark:text-[#00B2FF] normal-case login-logo-glow">
              2failure
            </h1>
          </div>
          <button
            type="button"
            onClick={onToggleDark}
            className="login-pill login-theme-pill flex items-center gap-2 normal-case"
            aria-label={
              isDark ? t.login.aria.switchToDay : t.login.aria.switchToNight
            }>
            {isDark ? (
              <Sun size={16} strokeWidth={2.5} />
            ) : (
              <Moon size={16} strokeWidth={2.5} />
            )}
            {isDark ? t.login.switchToDay : t.login.switchToNight}
          </button>
        </div>

        <div className="login-card w-full p-6 md:p-8">
          <h2 className="text-2xl tracking-tight mb-3 normal-case">{t.login.title}</h2>
          <p className="font-semibold text-sm opacity-70 mb-6 normal-case leading-snug">
            {t.login.subtitle}
          </p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <label className="block">
              <span className="login-field-label block">{t.login.email}</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className="login-input"
              />
            </label>

            <label className="block">
              <span className="login-field-label block">{t.login.password}</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className="login-input"
              />
            </label>

            <div className="grid gap-3 pt-1">
              <button
                type="submit"
                disabled={busy}
                className="login-btn login-btn--primary">
                {submitting === 'signIn' ? t.login.signingIn : t.login.signIn}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={busy}
                className="login-btn login-btn--google normal-case">
                <span className="flex items-center justify-center gap-3">
                  <GoogleGIcon className="w-6 h-6 shrink-0" />
                  {submitting === 'google'
                    ? t.login.redirectingGmail
                    : t.login.signInGmail}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                disabled={busy}
                className="login-btn login-btn--ghost">
                {submitting === 'signUp' ? t.login.signingUp : t.login.signUp}
              </button>
            </div>
          </form>

          {(error || authError) && (
            <p className="login-error mt-4 normal-case" role="alert">
              {error ?? authError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
