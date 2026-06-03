import React from 'react';
import { useAuth } from './context/AuthContext';
import { useDarkMode } from './hooks/useDarkMode';
import { AuthLoading } from './components/AuthLoading';
import { Login } from './components/Login';
import { MainApp } from './MainApp';

export function App() {
  const { user, loading } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Login isDark={isDark} onToggleDark={toggleDark} />;
  }

  return <MainApp />;
}
