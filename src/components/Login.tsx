import React, { useState } from 'react';
import { Skull } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import { supabase } from '../lib/supabase';
import { ThemeToggle } from './ThemeToggle';

interface LoginProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export function Login({ isDark, onToggleDark }: LoginProps) {
  const { authError, refreshSession } = useAuth();
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
      setError(
        err instanceof Error ? err.message : 'Could not sign in.'
      );
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
      setError(
        err instanceof Error ? err.message : 'Could not sign in with Gmail.'
      );
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
      setError(
        err instanceof Error ? err.message : 'Could not sign up.'
      );
    } finally {
      setSubmitting(null);
    }
  };

  const busy = submitting !== null;

  return (
    <div className="min-h-screen w-full bg-[#f4f4f0] dark:bg-[#1a1a1a] text-black dark:text-[#f4f4f0] flex flex-col p-4 md:p-8">
      <div className="flex justify-end max-w-md mx-auto w-full">
        <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <Skull size={48} strokeWidth={2.5} />
          <h1 className="logo-brand text-4xl md:text-5xl tracking-tighter text-[#00B2FF] normal-case">
            2failure
          </h1>
        </div>

        <div className="w-full bg-white dark:bg-[#2a2a2a] border-4 border-black dark:border-white p-6 md:p-8 brutal-shadow-sm">
          <h2 className="text-2xl mb-2">LOG IN</h2>
          <p className="font-bold text-black/70 dark:text-white/70 mb-8">
            Sign in with your email to track your failures. No excuses.
          </p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <label className="block">
              <span className="font-bold text-sm mb-1 block">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className="w-full bg-[#f4f4f0] dark:bg-[#1a1a1a] text-black dark:text-[#f4f4f0] border-4 border-black dark:border-white p-3 font-bold focus:outline-none focus:ring-2 focus:ring-[#00B2FF] disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="font-bold text-sm mb-1 block">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className="w-full bg-[#f4f4f0] dark:bg-[#1a1a1a] text-black dark:text-[#f4f4f0] border-4 border-black dark:border-white p-3 font-bold focus:outline-none focus:ring-2 focus:ring-[#00B2FF] disabled:opacity-60"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#00B2FF] text-black border-4 border-black dark:border-white p-4 font-bold text-lg brutal-shadow brutal-shadow-hover transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting === 'signIn' ? 'Signing in…' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="w-full bg-white dark:bg-[#f4f4f0] text-black border-4 border-black dark:border-white p-4 font-bold text-lg brutal-shadow brutal-shadow-hover transition-all disabled:opacity-60 disabled:cursor-not-allowed normal-case">
              {submitting === 'google' ? 'Redirecting to Gmail…' : 'Sign in through Gmail'}
            </button>

            <button
              type="button"
              onClick={handleSignUp}
              disabled={busy}
              className="w-full bg-white dark:bg-[#f4f4f0] text-black border-4 border-black dark:border-white p-4 font-bold text-lg brutal-shadow brutal-shadow-hover transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting === 'signUp' ? 'Signing up…' : 'Sign Up'}
            </button>
          </form>

          {(error || authError) && (
            <p className="mt-4 text-sm font-bold text-[#FF4D00]" role="alert">
              {error ?? authError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
