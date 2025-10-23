'use client';

import { Search, LogIn, UserPlus, Plus, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // Make sure this path is correct!

type NavLink = { label: string; href: string };

interface MobileMenuProps {
  navLinks: NavLink[];
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function MobileMenu({ navLinks, mobileMenuOpen, setMobileMenuOpen }: MobileMenuProps) {
  const { isAuthenticated, loading, logout } = useAuth();
  
  if (!mobileMenuOpen) return null;

  const handleLinkClick = () => setMobileMenuOpen(false);
  
  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <div className="md:hidden border-t border-orange-200 py-4 space-y-4 animate-fadeIn">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-900 w-4 h-4" />
        <input
          type="text"
          placeholder="Search recipes..."
          className="w-full pl-10 pr-4 py-2 border-2 border-orange-200 rounded-full text-sm focus:outline-none focus:border-amber-700"
        />
      </div>

      {/* Nav Links */}
      <ul className="space-y-2 list-none m-0 p-0">
        {navLinks.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              onClick={handleLinkClick}
              className="block text-gray-800 font-medium hover:text-amber-700 transition-colors py-1"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {/* auth Links */}
      <div className="border-t border-orange-200 pt-4 space-y-2">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : isAuthenticated ? (
          // Authenticated user options
          <>
            <Link
              href="/profile"
              onClick={handleLinkClick}
              className="flex items-center gap-3 text-gray-800 font-medium hover:text-amber-700 transition-colors py-1"
            >
              <User size={16} />
              My Profile
            </Link>
            <Link
              href="/create"
              onClick={handleLinkClick}
              className="flex items-center gap-3 text-amber-700 font-medium hover:text-amber-800 transition-colors py-1"
            >
              <Plus size={16} />
              Create Recipe
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full text-left items-center gap-3 text-gray-800 font-medium hover:text-red-600 transition-colors py-1"
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
              onClick={handleLinkClick}
              className="flex items-center gap-3 text-gray-800 font-medium hover:text-amber-700 transition-colors py-1"
            >
              <LogIn size={16} />
              Sign In
            </Link>
            <Link
              href="/auth"
              onClick={handleLinkClick}
              className="flex items-center gap-3 text-gray-800 font-medium hover:text-amber-700 transition-colors py-1"
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