import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-2 border-black dark:border-white p-2 brutal-shadow-sm brutal-shadow-hover transition-all"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {isDark ?
      <Sun size={20} strokeWidth={2.5} /> :
      <Moon size={20} strokeWidth={2.5} />}
    </button>
  );
}
