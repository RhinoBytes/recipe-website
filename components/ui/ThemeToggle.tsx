'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Palette } from 'lucide-react';

// Available themes
export const THEMES = {
  LIGHT: 'light-cottagecore',
  DARK: 'dark-cottagecore',
  TERRACOTTA: 'terracotta',
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
 * ✅ Default is now TERRACOTTA
 */
export function getStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return THEMES.TERRACOTTA;

  const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
  return stored || THEMES.TERRACOTTA;
}

/**
 * Theme toggle button component
 * Cycles between light, dark, and terracotta themes
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

  // Cycle through the available themes in order
  const toggleTheme = () => {
    const nextTheme =
      currentTheme === THEMES.LIGHT
        ? THEMES.DARK
        : currentTheme === THEMES.DARK
        ? THEMES.TERRACOTTA
        : THEMES.LIGHT;

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
        {/* Show terracotta icon as default to match server-side rendering */}
        <Palette size={20} className="text-text opacity-50" />
      </button>
    );
  }

  // Determine icon and labels
  let nextThemeName = 'dark';

  if (currentTheme === THEMES.LIGHT) {
    nextThemeName = 'dark';
  } else if (currentTheme === THEMES.DARK) {
    nextThemeName = 'terracotta';
  } else if (currentTheme === THEMES.TERRACOTTA) {
    nextThemeName = 'light';
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 flex items-center justify-center rounded-full bg-bg-secondary border border-border hover:bg-accent-light transition-colors"
      aria-label={`Switch to ${nextThemeName} theme`}
      title={`Switch to ${nextThemeName} theme`}
    >
      {/* All icons absolutely positioned with crossfade effect */}
      <Sun 
        size={20} 
        className={`absolute text-text transition-all duration-300 ${
          currentTheme === THEMES.LIGHT 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-180 scale-50'
        }`}
      />
      <Moon 
        size={20} 
        className={`absolute text-text transition-all duration-300 ${
          currentTheme === THEMES.DARK 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-180 scale-50'
        }`}
      />
      <Palette 
        size={20} 
        className={`absolute text-text transition-all duration-300 ${
          currentTheme === THEMES.TERRACOTTA 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-90 scale-50'
        }`}
      />
    </button>
  );
}