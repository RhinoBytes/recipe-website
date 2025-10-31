'use client';

import { useState, useRef, useEffect } from 'react';
import { LogIn, UserPlus, Plus, User, ChevronDown, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function UserDropdown() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // Track hydration
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout, loading } = useAuth();

  // Only render dynamic content after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    setDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-4 py-2 h-11 text-text font-medium hover:text-accent focus-visible:ring-2 focus-visible:ring-accent rounded-2xl transition"
        aria-haspopup="menu"
        aria-expanded={dropdownOpen}
        aria-controls="user-menu"
        disabled={loading}
      >
        {/* Avatar / Icon area */}
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-accent flex items-center justify-center bg-border">
          {!mounted || loading ? (
            <div className="w-full h-full animate-pulse bg-border" />
          ) : isAuthenticated && user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.username || 'User avatar'}
              width={32}
              height={32}
              priority
              className="object-cover w-full h-full"
              unoptimized={user.avatarUrl.startsWith('data:')}
            />
          ) : (
            <User size={20} className="text-text-muted" />
          )}
        </div>

        {/* Username / Login text */}
        <span className="hidden md:inline-block md:w-[120px] h-5 flex items-center">
          <span className="block w-full truncate text-left">
            {!mounted || loading
              ? ''
              : isAuthenticated
              ? user?.username || 'Account'
              : 'Login'}
          </span>
        </span>

        <ChevronDown
          size={16}
          className={`flex-shrink-0 transition-transform ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        id="user-menu"
        role="menu"
        className={`absolute right-0 mt-2 w-48 bg-bg-secondary rounded-2xl shadow-xl border-2 border-border py-2 z-50 transition-all duration-200 ease-out ${
          dropdownOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {mounted && (isAuthenticated ? (
          <>
            <div className="px-4 py-1 text-xs text-text-muted">
              Logged in as {user?.email || user?.username}
            </div>

            <Link
              href={`/profile/${user?.id}`}
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-text hover:bg-accent-light/30 hover:text-accent transition-colors"
            >
              <User size={16} />
              My Profile
            </Link>

            <Link
              href="/recipes/new"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-accent font-medium hover:bg-accent-light/30 transition-colors"
            >
              <Plus size={16} />
              Create Recipe
            </Link>

            <div className="h-px bg-border my-2" />

            <button
              onClick={handleLogout}
              className="flex w-full text-left items-center gap-3 px-4 py-3 text-text hover:bg-accent-light/30 hover:text-error transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth?tab=login"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-text hover:bg-accent-light/30 hover:text-accent transition-colors"
            >
              <LogIn size={16} />
              Sign In
            </Link>

            <Link
              href="/auth?tab=register"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-text hover:bg-accent-light/30 hover:text-accent transition-colors"
            >
              <UserPlus size={16} />
              Register
            </Link>
          </>
        ))}
      </div>
    </div>
  );
}
