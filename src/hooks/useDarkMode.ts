import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageKeyFor } from '../lib/persistedSettings';

export function useDarkMode() {
  const { user } = useAuth();
  const userId = user?.id;
  const key = storageKeyFor(userId, 'dark-mode');

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return raw === 'true';
    } catch {
      // ignore
    }
    // default for new users: night mode on
    return true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      window.localStorage.setItem(key, String(isDark));
    } catch {
      // Ignore storage failures.
    }
  }, [isDark, key]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setIsDark(raw === 'true');
      else setIsDark(true);
    } catch {
      setIsDark(true);
    }
  }, [key]);

  const toggle = () => setIsDark((d) => !d);

  return { isDark, toggle };
}
