'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Available themes
export const THEMES = {
  LIGHT: 'light-cottagecore',
  DARK: 'dark-cottagecore',
} as const;

export type ThemeName = typeof THEMES[keyof typeof THEMES];

const THEME_STORAGE_KEY = 'cottagecore-theme';

/**
 * Sets the theme on the document element and saves to localStorage
 */
export function setTheme(theme: ThemeName) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Gets the current theme from localStorage or returns default
 */
export function getStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return THEMES.LIGHT;
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
  return stored || THEMES.LIGHT;
}

/**
 * Theme toggle button component
 * Cycles between light and dark Cottagecore themes
 */
export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(THEMES.LIGHT);
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const theme = getStoredTheme();
    setCurrentTheme(theme);
    setTheme(theme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setCurrentTheme(newTheme);
    setTheme(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-full bg-bg-secondary border border-border hover:bg-accent-light transition-colors"
        aria-label="Toggle theme"
      >
        <Sun size={20} className="text-text" />
      </button>
    );
  }

  const isDark = currentTheme === THEMES.DARK;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-bg-secondary border border-border hover:bg-accent-light transition-colors"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? (
        <Sun size={20} className="text-text" />
      ) : (
        <Moon size={20} className="text-text" />
      )}
    </button>
  );
}
