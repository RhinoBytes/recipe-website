'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Available themes
export const THEMES = {
  TERRACOTTA: 'terracotta',
  DARK_TERRACOTTA: 'dark-terracotta',
} as const;

export type ThemeName = typeof THEMES[keyof typeof THEMES];

const THEME_STORAGE_KEY = 'app-theme';

/**
 * Sets the theme on the document element and saves to localStorage
 */
export function setTheme(theme: ThemeName) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Gets the current theme from localStorage or returns default
 * Default is TERRACOTTA (light mode)
 */
export function getStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return THEMES.TERRACOTTA;

  const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
  return stored || THEMES.TERRACOTTA;
}

/**
 * Theme toggle button component
 * Toggles between terracotta (light) and dark-terracotta (dark) themes
 */
export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(THEMES.TERRACOTTA);
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const theme = getStoredTheme();
    setCurrentTheme(theme);
    setTheme(theme);
    setMounted(true);
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const nextTheme = currentTheme === THEMES.TERRACOTTA 
      ? THEMES.DARK_TERRACOTTA 
      : THEMES.TERRACOTTA;

    setCurrentTheme(nextTheme);
    setTheme(nextTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        className="w-10 h-10 flex items-center justify-center rounded-full bg-bg-secondary border border-border transition-colors pointer-events-none"
        aria-label="Loading theme toggle"
        disabled
      >
        {/* Show sun icon as default to match server-side rendering */}
        <Sun size={20} className="text-text opacity-50" />
      </button>
    );
  }

  // Determine next theme name and icon
  const isDark = currentTheme === THEMES.DARK_TERRACOTTA;
  const nextThemeName = isDark ? 'light' : 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 flex items-center justify-center rounded-full bg-bg-secondary border border-border hover:bg-accent-light transition-colors"
      aria-label={`Switch to ${nextThemeName} theme`}
      title={`Switch to ${nextThemeName} theme`}
    >
      {/* Icons with smooth transition */}
      <Sun 
        size={20} 
        className={`absolute text-text transition-all duration-300 ${
          !isDark
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-180 scale-50'
        }`}
      />
      <Moon 
        size={20} 
        className={`absolute text-text transition-all duration-300 ${
          isDark
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-180 scale-50'
        }`}
      />
    </button>
  );
}