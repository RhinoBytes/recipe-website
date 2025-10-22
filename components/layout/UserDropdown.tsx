'use client';

import { LogIn, UserPlus, Plus, User, ChevronDown, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // Make sure this path is correct!

interface UserDropdownProps {
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  dropdownRef?: React.RefObject<HTMLElement>;
}

export default function UserDropdown({ dropdownOpen, setDropdownOpen, dropdownRef }: UserDropdownProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  
  // Add this for debugging
  console.log("Auth state:", { isAuthenticated, loading, user });
  
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    setDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-4 py-2 text-gray-800 font-medium hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-700 rounded-md transition"
        aria-haspopup="menu"
        aria-expanded={dropdownOpen}
        aria-controls="user-menu"
      >
        <User size={18} />
        {loading ? 'Loading...' : isAuthenticated ? (user?.username || 'Account') : 'Login'}
        <ChevronDown
          size={16}
          className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        id="user-menu"
        role="menu"
        className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50 transition-all duration-200 ease-out ${
          dropdownOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {loading ? (
          <div className="px-4 py-3 text-gray-500">Loading...</div>
        ) : isAuthenticated ? (
          // Authenticated user options
          <>
            <div className="px-4 py-1 text-xs text-gray-500">
              Logged in as {user?.email || user?.username}
            </div>
            <Link
              href="/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-50 hover:text-amber-700 transition-colors"
            >
              <User size={16} />
              My Profile
            </Link>
            <Link
              href="/create"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-amber-700 font-medium hover:bg-orange-50 transition-colors"
            >
              <Plus size={16} />
              Create Recipe
            </Link>
            <div className="h-px bg-orange-200 my-2"></div>
            <button
              onClick={handleLogout}
              className="flex w-full text-left items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </>
        ) : (
          // Non-authenticated user options
          <>
            <Link
              href="/auth"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-50 hover:text-amber-700 transition-colors"
            >
              <LogIn size={16} />
              Sign In
            </Link>
            <Link
              href="/auth"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-50 hover:text-amber-700 transition-colors"
            >
              <UserPlus size={16} />
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}